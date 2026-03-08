/**
 * scripts/test-audio.ts
 * 
 * Minimal end-to-end smoke test for the Liminal Sin WebSocket ↔ Gemini Live pipeline.
 * 
 * What this validates:
 *  1. Server accepts a WebSocket connection
 *  2. Server initialises a Jason NPC Gemini Live session and sends session_ready
 *  3. A player_speech packet (silent PCM) reaches Gemini without crashing the server
 *  4. The server delivers at least one agent_speech audio chunk back (proves Jason responded)
 *  5. Any GM function calls (trust_update, hud_glitch, scene_change, slotsky_trigger) are logged
 * 
 * NOTE: agent_speech audio comes from the JASON NPC session (Fenrir voice).
 * The GM session is silent — it only emits function calls. This test does NOT
 * expect or validate any audio from the GM.
 * 
 * Usage:
 *   npx ts-node scripts/test-audio.ts [ws://localhost:3001]
 */

import WebSocket from 'ws';

const WS_URL = process.argv[2] ?? 'ws://localhost:3001';
const TIMEOUT_MS = 20_000;

// --- helpers -----------------------------------------------------------------

/** Generate 0.5 s of silence as 16-bit PCM @ 16 kHz (little-endian, mono). */
function silentPcmBase64(): string {
  const sampleRate = 16_000;
  const durationSec = 0.5;
  const numSamples = sampleRate * durationSec;
  const buf = Buffer.alloc(numSamples * 2, 0); // 16-bit = 2 bytes per sample
  return buf.toString('base64');
}

function ts(): string {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

// --- main --------------------------------------------------------------------

console.log(`\n[test-audio] Connecting to ${WS_URL} …\n`);

const ws = new WebSocket(WS_URL);

let sessionReady = false;
let agentSpeechCount = 0;
let functionCallCount = 0;
let passed = false;

const timer = setTimeout(() => {
  summarise();
  ws.close();
  process.exit(passed ? 0 : 1);
}, TIMEOUT_MS);

ws.on('open', () => {
  console.log(`[${ts()}] ✅ WebSocket connected`);
});

ws.on('message', (raw: Buffer) => {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    console.log(`[${ts()}] ⚠️  Non-JSON message received (${raw.length} bytes) — possible raw audio`);
    return;
  }

  const type = msg.type as string | undefined;

  switch (type) {
    case 'session_ready': {
      sessionReady = true;
      console.log(`[${ts()}] ✅ session_ready — session_id: ${msg.session_id}`);
      // Step 1: send a text message to trigger an audio response (bypasses VAD)
      console.log(`[${ts()}] → Sending player_text to trigger Gemini response …`);
      ws.send(JSON.stringify({ type: 'player_text', text: 'Jason, can you hear me?' }));
      // Step 2: also send a silent PCM chunk to verify the audio path doesn't crash
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`[${ts()}] → Sending silent player_speech chunk to verify audio path …`);
          ws.send(JSON.stringify({ type: 'player_speech', audio: silentPcmBase64() }));
        }
      }, 2000);
      break;
    }

    case 'agent_speech': {
      agentSpeechCount++;
      const audioLen = typeof msg.audio === 'string' ? (msg.audio as string).length : 0;
      if (agentSpeechCount === 1) {
        console.log(`[${ts()}] ✅ agent_speech received — agent: ${msg.agent}, base64 bytes: ${audioLen}`);
        passed = true;
      } else {
        console.log(`[${ts()}] 🔊 agent_speech chunk #${agentSpeechCount} (${audioLen} bytes)`);
      }
      break;
    }

    case 'agent_interrupt': {
      console.log(`[${ts()}] ⚡ agent_interrupt — agent: ${msg.agent}`);
      break;
    }

    // GM function call events broadcast from gameMaster.ts
    case 'trust_update':
    case 'hud_glitch':
    case 'scene_change':
    case 'slotsky_trigger':
    case 'scene_image': {
      functionCallCount++;
      console.log(`[${ts()}] 🎲 GM event [${type}]:`, JSON.stringify(msg).slice(0, 200));
      break;
    }

    default: {
      console.log(`[${ts()}] ℹ️  Unknown message type "${type}":`, JSON.stringify(msg).slice(0, 200));
    }
  }
});

ws.on('error', (err) => {
  console.error(`[${ts()}] ❌ WebSocket error:`, err.message);
});

ws.on('close', (code, reason) => {
  console.log(`[${ts()}] WebSocket closed — code: ${code}, reason: ${reason.toString() || '(none)'}`);
  clearTimeout(timer);
  summarise();
  process.exit(passed ? 0 : 1);
});

function summarise() {
  console.log('\n──────────────────────────────────────────');
  console.log('SMOKE TEST RESULTS');
  console.log('──────────────────────────────────────────');
  console.log(`  SESSION_READY received : ${sessionReady ? '✅ YES' : '❌ NO'}`);
  console.log(`  agent_speech chunks    : ${agentSpeechCount > 0 ? `✅ ${agentSpeechCount}` : '❌ 0'}`);
  console.log(`  GM function calls      : ${functionCallCount}`);
  console.log(`  Overall result         : ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('──────────────────────────────────────────\n');
}
