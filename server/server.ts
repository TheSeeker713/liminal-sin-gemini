import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

import { getOrCreateSession, logClientError } from './services/db';
import { getGameMasterSystemPrompt, LiveSessionManager } from './services/gemini';
import { getJasonSystemPrompt } from './services/npc/jason';
import { getAudreySystemPrompt } from './services/npc/audrey';
import { handleGmFunctionCall } from './services/gameMaster';
import { prewarmImageCache, clearImageCache } from './services/imagen';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'liminal-sin-mock-ws' });
});

/**
 * POST /debug/fire-gm-event
 * Step K battle-test helper — manually fires any GM function call against an
 * active session without needing Gemini to generate it. Only available when
 * NODE_ENV !== 'production' OR when DEBUG_GM_ENDPOINT=true is set.
 *
 * Body: { sessionId: string, functionName: string, args: object }
 * Example:
 *   { "sessionId": "...", "functionName": "triggerGlitchEvent", "args": { "intensity": "high", "type": "both" } }
 */
const debugSessions = new Map<string, { ws: WebSocket; jasonManager: LiveSessionManager }>();

app.post('/debug/fire-gm-event', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_GM_ENDPOINT !== 'true') {
    res.status(403).json({ error: 'Debug endpoint disabled in production. Set DEBUG_GM_ENDPOINT=true to enable.' });
    return;
  }
  const { sessionId, functionName, args } = req.body as {
    sessionId?: string;
    functionName?: string;
    args?: Record<string, unknown>;
  };
  if (!sessionId || !functionName) {
    res.status(400).json({ error: 'sessionId and functionName are required' });
    return;
  }
  const entry = debugSessions.get(sessionId);
  if (!entry) {
    res.status(404).json({ error: `No active session found for sessionId: ${sessionId}. Available: [${[...debugSessions.keys()].join(', ')}]` });
    return;
  }
  try {
    await handleGmFunctionCall(sessionId, functionName, args ?? {}, entry.ws, entry.jasonManager);
    res.json({ ok: true, fired: functionName, args: args ?? {} });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /log-client-error
 * Frontend error reporting endpoint. Writes one doc to Firestore client_error_logs.
 * No auth — errors only, no secrets. AbortSignal.timeout(3000) on the frontend side.
 */
app.post('/log-client-error', async (req, res) => {
  const { sessionId, errorType, message, severity, stack, url, timestamp } = req.body as {
    sessionId?: string;
    errorType?: string;
    message?: string;
    severity?: 'info' | 'warning' | 'error' | 'fatal';
    stack?: string;
    url?: string;
    timestamp?: number;
  };
  if (!sessionId || !errorType || !message || !severity) {
    res.status(400).json({ error: 'sessionId, errorType, message, and severity are required' });
    return;
  }
  try {
    await logClientError({
      sessionId,
      errorType,
      message,
      severity,
      stack,
      url,
      timestamp: timestamp ?? Date.now(),
      receivedAt: Date.now()
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

wss.on('connection', (ws: WebSocket) => {
  const sessionId = randomUUID();
  const jasonManager = new LiveSessionManager(); // NPC — speaks, audio out, Enceladus voice
  const gmManager = new LiveSessionManager();    // GM — silent, function calls only
  const audreyManager = new LiveSessionManager(); // NPC — single echo, Aoede voice
  let jasonIntroFired = false; // Gates Jason's first line until frontend sends intro_complete
  let sceneChangeCount = 0;   // Tracks GM-triggered scene changes (used by hint timer)
  let hintTimer: ReturnType<typeof setTimeout> | null = null; // B11: flashlight hint fallback

  console.log(`[WS] Client connected — session ${sessionId}`);
  // Register for debug endpoint access
  debugSessions.set(sessionId, { ws, jasonManager });

  // Init Firestore session + both Gemini Live sessions asynchronously.
  // Send SESSION_READY once all are established.
  (async () => {
    try {
      const sessionData = await getOrCreateSession(sessionId);

      // Jason NPC session — audio out to player
      const jasonPrompt = getJasonSystemPrompt(sessionData.trustLevel, sessionData.fearIndex);
      await jasonManager.connect(jasonPrompt, 'npc');

      jasonManager.onAgentAudio((base64Audio) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_speech',
            agent: 'jason',
            audio: base64Audio
          }));
        }
      });

      jasonManager.onAgentInterrupt(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'agent_interrupt', agent: 'jason' }));
        }
      });

      // Audrey NPC session — Aoede voice, single echo, trust-gated
      const audreyPrompt = getAudreySystemPrompt();
      await audreyManager.connect(audreyPrompt, 'npc', 'Aoede');

      audreyManager.onAgentAudio((base64Audio) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_speech',
            agent: 'audrey',
            audio: base64Audio
          }));
        }
      });

      // GM session — silent, function calls only, no audio back to player
      const gmPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      await gmManager.connect(gmPrompt, 'gm');

      gmManager.onFunctionCall((id, name, args) => {
        // Track scene changes for B11 hint timer.
        if (name === 'triggerSceneChange') sceneChangeCount++;
        // Always ACK the tool call back to Gemini — even if the WS is closed.
        // If we skip the ACK, Gemini hangs permanently waiting for a response.
        // handleGmFunctionCall already guards ws.readyState internally before sending.
        //
        // Trust-gate Audrey: only register the callback when trust is sufficient.
        // getOrCreateSession is cheap here — we only fire once per session at beat 6.
        const audreyCallback = (trustLevel: number) => {
          const trustTag = trustLevel >= 0.7
            ? 'HIGH — sound hopeful. Call out "Jason?" softly. You sense he might be close.'
            : trustLevel < 0.4
              ? 'LOW — you are crying quietly. Do not use his name. You feel very far away.'
              : 'NEUTRAL — scared but holding it together. One short sentence. Muffled, echoing.';
          audreyManager.sendText(
            `[AUDREY_TRIGGER: trust=${trustLevel.toFixed(2)}. ${trustTag} ` +
            'Speak once. 1 sentence maximum. Then go completely silent.]'
          );
          console.log(`[WS] Audrey triggered — trust=${trustLevel.toFixed(2)} session=${sessionId}`);
        };
        handleGmFunctionCall(sessionId, name, args, ws, jasonManager, (trustLevel) => { audreyCallback(trustLevel); }).finally(() => {
          gmManager.sendToolResponse(id, name);
        });
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'session_ready', session_id: sessionId }));
        // BLACK SCREEN START — no image generation on session open.
        // The game begins in darkness. Player hears only audio (SFX + JASON voice).
        // Scene images are generated later when the GM decides (e.g. player suggests flashlight).

        // Jason's intro sequence fires when the frontend sends intro_complete (after title card).
        // At session start Jason does NOT know the voicebox is active — see intro_complete handler.
      }
    } catch (err) {
      console.error(`[WS] Failed to init sessions for ${sessionId}:`, err);
      ws.close();
    }
  })();
  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      // Frontend signals the intro title card has finished — fire Jason's landing sequence.
      // Jason is hurt, alone, in darkness. He does NOT know the voicebox is on yet.
      if (data.type === 'intro_complete' && !jasonIntroFired) {
        jasonIntroFired = true;
        console.log(`[WS] intro_complete received — firing Jason landing sequence for session ${sessionId}`);
        // Pre-warm image cache for the 3 opening zones while Jason speaks in darkness.
        prewarmImageCache(sessionId);
        // B11: If GM fires no scene change within 45s, nudge the player to ask about a flashlight.
        hintTimer = setTimeout(() => {
          if (sceneChangeCount === 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'hint', text: 'ask him if he has a flashlight' }));
            console.log(`[WS] Hint sent — no scene change after 45s for session ${sessionId}`);
          }
        }, 45_000);
        jasonManager.sendText(
          '[SEQUENCE_TRIGGER — You just slammed into the concrete floor. Hard landing. ' +
          'Your shoulder took the impact — something may be cracked. ' +
          'It is pitch black. Cold water dripping nearby. You cannot see anything. ' +
          'Take a sharp breath of pain. Then call out "Audrey? … Josh?" once, quietly. ' +
          'Wait a beat. No answer. Just dripping. Silence. ' +
          'The voicebox in your hand is dark — you have not noticed it yet. ' +
          'DO NOT address anyone through the device. DO NOT mention the voicebox. You are alone.]'
        );
        return;
      }

      // Route Game Master function call events
      if (data.type === 'GM_FUNCTION_CALL' && data.sessionId && data.functionName) {
        handleGmFunctionCall(data.sessionId, data.functionName, data.args ?? {}, ws, jasonManager);
        return;
      }

      // Player speech — base64 PCM audio from the browser → Jason NPC + GM (for trust evaluation)
      if (data.type === 'player_speech' && data.audio) {
        console.log(`[WS] player_speech received — b64 bytes: ${(data.audio as string).length}`);
        jasonManager.sendAudio(data.audio);
        gmManager.sendAudio(data.audio); // GM hears player to evaluate trust/fear in real-time
        return;
      }

      // Player webcam frame — base64 JPEG from browser → Game Master (1 FPS, GM vision)
      if (data.type === 'player_frame' && data.jpeg) {
        gmManager.sendFrame(data.jpeg);
        return;
      }

      // Player text — direct text message (used for testing / GM commands)
      if (data.type === 'player_text' && data.text) {
        jasonManager.sendText(data.text);
        return;
      }
    } catch {
      // Raw binary fallback — forward to Jason NPC
      jasonManager.sendAudio(message.toString('base64'));
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected — session ${sessionId}`);
    if (hintTimer) clearTimeout(hintTimer);
    debugSessions.delete(sessionId);
    clearImageCache(sessionId);
    jasonManager.disconnect();
    audreyManager.disconnect();
    gmManager.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});


