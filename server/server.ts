import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firestore on startup
import './services/db';
import { handleGmFunctionCall } from './services/gameMaster';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'liminal-sin-mock-ws' });
});

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected');

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[WS] Received:`, data);

      // Route Game Master function call events from the Gemini server
      if (data.type === 'GM_FUNCTION_CALL' && data.sessionId && data.functionName) {
        handleGmFunctionCall(data.sessionId, data.functionName, data.args ?? {}, ws);
        return;
      }

      // Echo all other messages back (will be replaced by full Gemini Live stream wiring in Step 10)
      ws.send(JSON.stringify({ type: 'ECHO', payload: data }));
    } catch {
      // Binary audio data — will be handled when Gemini Live audio streaming is wired in
      console.log(`[WS] Received raw buffer of length: ${message.length}`);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});
