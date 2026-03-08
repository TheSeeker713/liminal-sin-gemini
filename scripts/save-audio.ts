/**
 * scripts/save-audio.ts
 *
 * Connects to the Liminal Sin WebSocket server, sends a text prompt to Jason,
 * collects all agent_speech PCM chunks, and writes them to a WAV file so you
 * can actually HEAR Jason's Fenrir voice.
 *
 * Usage:
 *   npm run save-audio               (targets ws://localhost:3001)
 *   npm run save-audio ws://...      (targets a custom URL)
 *
 * Output:
 *   scripts/output/jason_response.wav
 *   — open this file in any media player to hear Jason
 */

import WebSocket from 'ws';
import * as fs from 'fs';
import * as path from 'path';

const WS_URL = process.argv[2] ?? 'ws://localhost:3001';
const TIMEOUT_MS = 25_000;
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'jason_response.wav');

// Gemini Live outputs 24kHz 16-bit PCM mono by default
const SAMPLE_RATE = 24_000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

// ─── WAV writer ───────────────────────────────────────────────────────────────

function writeWav(pcmChunks: Buffer[]): void {
  const pcmData = Buffer.concat(pcmChunks);
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);
  let o = 0;

  header.write('RIFF', o);                                                        o += 4;
  header.writeUInt32LE(36 + dataSize, o);                                         o += 4;
  header.write('WAVE', o);                                                        o += 4;
  header.write('fmt ', o);                                                        o += 4;
  header.writeUInt32LE(16, o);                                                    o += 4;  // PCM sub-chunk size
  header.writeUInt16LE(1, o);                                                     o += 2;  // PCM format
  header.writeUInt16LE(CHANNELS, o);                                              o += 2;
  header.writeUInt32LE(SAMPLE_RATE, o);                                           o += 4;
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8), o);             o += 4;  // byte rate
  header.writeUInt16LE(CHANNELS * (BIT_DEPTH / 8), o);                           o += 2;  // block align
  header.writeUInt16LE(BIT_DEPTH, o);                                             o += 2;
  header.write('data', o);                                                        o += 4;
  header.writeUInt32LE(dataSize, o);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, Buffer.concat([header, pcmData]));
}

// ─── main ────────────────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toISOString().slice(11, 23);
}

console.log(`\n[save-audio] Connecting to ${WS_URL} …\n`);

const ws = new WebSocket(WS_URL);
const pcmChunks: Buffer[] = [];
let chunkCount = 0;
let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  ws.close();

  console.log('\n──────────────────────────────────────────');
  console.log('JASON VOICE TEST RESULTS');
  console.log('──────────────────────────────────────────');
  console.log(`  PCM chunks received  : ${chunkCount}`);

  if (pcmChunks.length === 0) {
    console.log('  Result               : ❌ No audio received — check server logs for errors');
    console.log('──────────────────────────────────────────\n');
    process.exit(1);
  }

  writeWav(pcmChunks);

  const totalBytes = pcmChunks.reduce((sum, b) => sum + b.length, 0);
  const durationSec = (totalBytes / (SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8))).toFixed(2);

  console.log(`  Total PCM bytes      : ${totalBytes}`);
  console.log(`  Estimated duration   : ~${durationSec}s`);
  console.log(`  Output file          : ${OUTPUT_FILE}`);
  console.log('  Result               : ✅ Open the WAV file to hear Jason (Fenrir voice)');
  console.log('──────────────────────────────────────────\n');
  process.exit(0);
}

const timer = setTimeout(() => {
  console.log(`[${ts()}] ⏱  Timeout — saving whatever was collected …`);
  finish();
}, TIMEOUT_MS);

ws.on('open', () => {
  console.log(`[${ts()}] ✅ WebSocket connected`);
});

ws.on('message', (raw: Buffer) => {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  const type = msg.type as string | undefined;

  if (type === 'SESSION_READY') {
    console.log(`[${ts()}] ✅ SESSION_READY — sending prompt to Jason …`);
    ws.send(JSON.stringify({
      type: 'player_text',
      text: 'Jason, describe what you see right now in one sentence.'
    }));
  }

  if (type === 'agent_speech') {
    const b64 = msg.audio as string;
    if (b64) {
      pcmChunks.push(Buffer.from(b64, 'base64'));
      chunkCount++;
      if (chunkCount === 1) {
        console.log(`[${ts()}] 🔊 Receiving agent_speech chunks …`);
      }
    }
  }

  if (type === 'agent_interrupt') {
    console.log(`[${ts()}] ⚡ agent_interrupt — saving collected audio`);
    finish();
  }
});

ws.on('error', (err) => {
  console.error(`[${ts()}] ❌ WebSocket error:`, err.message);
  finish();
});

ws.on('close', () => {
  finish();
});
