import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

import { getOrCreateSession } from './services/db';
import { getGameMasterSystemPrompt } from './services/gemini';
import { handleGmFunctionCall } from './services/gameMaster';
import { openLiveSession, LiveSessionHandle } from './services/liveSession';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'liminal-sin-mock-ws' });
});

wss.on('connection', (ws: WebSocket) => {
  const sessionId = randomUUID();
  let liveHandle: LiveSessionHandle | null = null;

  console.log(`[WS] Client connected — session ${sessionId}`);

  // Init Firestore session + Gemini Live session asynchronously.
  // Send SESSION_READY once both are established so the client
  // knows its sessionId and can begin sending audio.
  (async () => {
    try {
      const sessionData = await getOrCreateSession(sessionId);
      const systemPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      liveHandle = await openLiveSession(sessionId, systemPrompt, ws);
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
      console.log(`[WS] Received:`, data);

      // Route Game Master function call events
      if (data.type === 'GM_FUNCTION_CALL' && data.sessionId && data.functionName) {
        handleGmFunctionCall(data.sessionId, data.functionName, data.args ?? {}, ws);
        return;
      }
    } catch {
      // Binary PCM audio from the browser — forward to Gemini Live
      if (liveHandle) {
        liveHandle.sendAudio(message);
      } else {
        console.warn(`[WS] Audio received before Live session ready — dropping buffer (${message.length} bytes)`);
      }
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected — session ${sessionId}`);
    liveHandle?.close();
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});
