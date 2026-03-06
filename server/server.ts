import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'liminal-sin-mock-ws' });
});

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected');

  ws.on('message', (message: Buffer) => {
    try {
      // In the future this will parse event types (Audio chunk, interrupt, etc)
      const data = JSON.parse(message.toString());
      console.log(`[WS] Received:`, data);
      
      // Echo it back to confirm full duplex mapping
      ws.send(JSON.stringify({ type: 'ECHO', payload: data }));
    } catch (e) {
      // It might be binary audio data. We will handle that later.
      console.log(`[WS] Received raw buffer of length: ${message.length} (error parsing JSON: ${(e as Error).message})`);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] Mock WebSocket & Express server running on ws://localhost:${PORT}`);
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});
