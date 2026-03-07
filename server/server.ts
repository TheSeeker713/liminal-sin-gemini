import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

import { getOrCreateSession } from './services/db';
import { getGameMasterSystemPrompt, LiveSessionManager } from './services/gemini';
import { handleGmFunctionCall } from './services/gameMaster';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'liminal-sin-mock-ws' });
});

wss.on('connection', (ws: WebSocket) => {
  const sessionId = randomUUID();
  const liveManager = new LiveSessionManager();

  console.log(`[WS] Client connected — session ${sessionId}`);

  // Init Firestore session + Gemini Live session asynchronously.
  // Send SESSION_READY once both are established so the client
  // knows its sessionId and can begin sending audio.
  (async () => {
    try {
      const sessionData = await getOrCreateSession(sessionId);
      const systemPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      await liveManager.connect(systemPrompt);

      // Wire output hooks back to frontend
      liveManager.onAgentAudio((base64Audio) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_speech',
            agent: 'jason', // Dynamically map in Phase 3/4
            audio: base64Audio
          }));
        }
      });

      liveManager.onAgentInterrupt(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'agent_interrupt', agent: 'jason' }));
        }
      });
      
      liveManager.onFunctionCall((name, args) => {
        if (ws.readyState === WebSocket.OPEN) {
           handleGmFunctionCall(sessionId, name, args as any, ws);
        }
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'SESSION_READY', sessionId }));
      }
    } catch (err) {
      console.error(`[WS] Failed to init Live session for ${sessionId}:`, err);
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

      // Player speech — base64 PCM audio from the browser → Gemini Live
      if (data.type === 'player_speech' && data.audio) {
        liveManager.sendAudio(data.audio);
        return;
      }
    } catch {
      // Raw binary fallback — forward to Gemini Live
      liveManager.sendAudio(message.toString('base64'));
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected — session ${sessionId}`);
    liveManager.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});


