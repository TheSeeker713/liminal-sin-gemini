import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

import { getOrCreateSession } from './services/db';
import { getGameMasterSystemPrompt, LiveSessionManager } from './services/gemini';
import { getJasonSystemPrompt } from './services/npc/jason';
import { handleGmFunctionCall } from './services/gameMaster';

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

wss.on('connection', (ws: WebSocket) => {
  const sessionId = randomUUID();
  const jasonManager = new LiveSessionManager(); // NPC — speaks, audio out, Fenrir voice
  const gmManager = new LiveSessionManager();    // GM — silent, function calls only

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

      // GM session — silent, function calls only, no audio back to player
      const gmPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      await gmManager.connect(gmPrompt, 'gm');

      gmManager.onFunctionCall((id, name, args) => {
        if (ws.readyState === WebSocket.OPEN) {
          handleGmFunctionCall(sessionId, name, args, ws, jasonManager).finally(() => {
            gmManager.sendToolResponse(id, name);
          });
        }
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'session_ready', session_id: sessionId }));
        // Fire initial Imagen 4 scene so the screen isn't black on session start.
        void handleGmFunctionCall(sessionId, 'triggerSceneChange', { sceneKey: 'zone_tunnel_entry' }, ws);
        // Trigger Jason's opening monologue immediately after the client is ready.
        // The voicebox activated on its own — he didn't press anything.
        jasonManager.sendText(
          '[VOICEBOX ACTIVATION — the device in your hand just turned on by itself. ' +
          'You did not press anything. A voice is coming through it for the first time. ' +
          'React. One short sentence, holding your breath.]'
        );
      }
    } catch (err) {
      console.error(`[WS] Failed to init sessions for ${sessionId}:`, err);
      ws.close();
    }
  })();
  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      // Route Game Master function call events
      if (data.type === 'GM_FUNCTION_CALL' && data.sessionId && data.functionName) {
        handleGmFunctionCall(data.sessionId, data.functionName, data.args ?? {}, ws);
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
    debugSessions.delete(sessionId);
    jasonManager.disconnect();
    gmManager.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});


