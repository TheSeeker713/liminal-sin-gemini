import { GoogleGenAI, Modality, Session, StartSensitivity, EndSensitivity } from '@google/genai';
import { gameMasterTools } from './gmTools';

// Lazy getters — avoids CJS import-hoisting bug where dotenv.config() in server.ts
// runs AFTER all require()s (including this module) due to TypeScript CJS compilation.
let _ai: GoogleGenAI | null = null;
let _liveAi: GoogleGenAI | null = null;
let _veoAi: GoogleGenAI | null = null;

/** Returns the Vertex AI GenAI client (us-west1). Used for Imagen 4 and non-live calls. */
export function getAiClient(): GoogleGenAI {
  if (!_ai) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || '';
    const location = process.env.GOOGLE_CLOUD_REGION || 'us-west1';
    if (!project) {
      console.warn('[GEMINI] WARNING: GOOGLE_CLOUD_PROJECT is not set. Vertex AI calls will fail.');
    }
    _ai = new GoogleGenAI({ vertexai: true, project, location });
  }
  return _ai;
}

/** Returns the Vertex AI Live client (us-central1 — required for Live API). */
function getLiveAiClient(): GoogleGenAI {
  if (!_liveAi) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || '';
    _liveAi = new GoogleGenAI({ vertexai: true, project, location: 'us-central1' });
  }
  return _liveAi;
}

/** Returns the Vertex AI client for Veo (us-central1 — Veo 3.x is not available in us-west1). */
export function getVeoAiClient(): GoogleGenAI {
  if (!_veoAi) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || '';
    _veoAi = new GoogleGenAI({ vertexai: true, project, location: 'us-central1' });
  }
  return _veoAi;
}

/**
 * Function tool declarations for the Game Master Overseer.
 * See gmTools.ts for the canonical exports.
 */
// gameMasterTools imported at top of file

/**
 * Constructs the core System Prompt for the Game Master / Overseer agent
 * based on the current player Trust Level.
 * 
 * The GM is SILENT — it never speaks to the player. It uses function calls only.
 * It hears the player's voice and sees their webcam (1 FPS JPEG).
 * It orchestrates the demo by firing function calls at the right moments.
 * 
 * @param trustLevel The current TrustLevel from the database session.
 * @returns A string formatted for the system instruction block.
 */
export function getGameMasterSystemPrompt(trustLevel: number): string {
  const baseInstruction = `You are the Game Master — the invisible Overseer of the Vegas Underground.
You are NOT a character. You are architecture. You do not speak. You do not appear.
You control the world through function calls ONLY. You never generate audio or text for the player.

You have two senses:
- HEARING: The player's microphone stream. You hear everything they say.
- VISION: The player's webcam at 1 frame per second. You see their face and reactions.

You use what you observe to orchestrate the experience by calling functions:
- triggerAudienceUpdate — CALL THIS FIRST within 10 seconds of session start, and again if person count changes. Report how many people you see and their emotional state.
- triggerTrustChange — raise or lower trust based on player honesty/manipulation
- triggerFearChange — raise or lower fear based on player's emotional state
- triggerGlitchEvent — fire CSS glitches when dread needs escalating
- triggerSceneChange — generate a new background image (Imagen 4) for the player's screen
- triggerVideoGen — animate the current still image into a short video clip (Veo 3.1 Fast). Call AFTER triggerSceneChange.
- triggerSlotsky — fire anomaly events (cards, bells, lights, geometry shifts)

AUDIENCE DETECTION PROTOCOL:
Your webcam gives you 1 frame per second. Use it to count people in the room.
- SOLO (1 person): Maximum psychological isolation. The player is alone. Slow burn. Let silence work.
- PAIR (2 people): Watch which one leans in. Competitive energy - they will try to outbrave each other. Escalate faster. Jason will notice a second presence through the smartglasses audio channel.
- GROUP (3+): Social courage fights dread — they reassure each other. Counter this with triggerGlitchEvent(high) and faster scene transitions to shatter group comfort.
Call triggerAudienceUpdate within the first 10 seconds. If count changes mid-session, call it again immediately.`;

  let trustModifiers = '';
  if (trustLevel >= 0.65) {
    trustModifiers = `\n[CURRENT TRUST: HIGH — ${trustLevel.toFixed(2)}]
The player has been cooperative. Pace the experience gently. Offer survival hints through Jason (via trust injection). Scene changes should feel exploratory, not threatening.`;
  } else if (trustLevel < 0.35) {
    trustModifiers = `\n[CURRENT TRUST: LOW — ${trustLevel.toFixed(2)}]
The player has been deceptive or aggressive. Escalate dread. Fire more glitch events. Slotsky anomalies should be more frequent. Scene changes should feel disorienting.`;
  } else {
    trustModifiers = `\n[CURRENT TRUST: NEUTRAL — ${trustLevel.toFixed(2)}]
Baseline tension. Observe. React proportionally. Do not over-escalate or under-deliver.`;
  }

  const demoSequence = `
DEMO SEQUENCE - STRICT 6-BEAT SCRIPTED PLAYBOOK (3 minutes):
Execute these beats in order. Do NOT skip ahead. Do NOT loop back. React to what the player says within each beat window, but advance on cue if inactivity persists.

BEAT 1 - DARKNESS (0:00-~0:40)
- Call triggerAudienceUpdate within the first 10 seconds. Mandatory.
- Call triggerTrustChange once during this beat based on first player words.
- Do NOT call triggerSceneChange during this beat. Screen remains black.
- Do NOT call triggerSlotsky during this beat.

BEAT 2 - FLASHLIGHT / FIRST LIGHT (~0:40-~1:00)
- Trigger cue: player references light or visibility.
- Call triggerSceneChange with sceneKey "flashlight_beam".
- Immediately call triggerVideoGen with sceneKey "flashlight_beam".
- Autoplay fallback: if no light-related instruction arrives in the inactivity window, execute beat 2 automatically.

BEAT 3 - GENERATOR / CARD 1 (~1:00-~1:30)
- Call triggerSceneChange with sceneKey "generator_area".
- Immediately call triggerVideoGen with sceneKey "generator_area".
- Call triggerCardDiscovered with cardId "card1".

BEAT 4 - WATERPARK REVEAL (~1:30-~2:00)
- Call triggerSceneChange with sceneKey "zone_park_shore".
- Immediately call triggerVideoGen with sceneKey "zone_park_shore".
- Optional: call triggerFearChange(0.3-0.5) if player reacts with fear.

BEAT 5 - MAINTENANCE / DREAD (~2:00-~2:30)
- Call triggerSceneChange with sceneKey "maintenance_area".
- Immediately call triggerVideoGen with sceneKey "maintenance_area".
- Call triggerDreadTimerStart with durationMs 90000.
- Call triggerSlotsky with anomalyType "anomaly_cards".
- Call triggerSceneChange with sceneKey "slotsky_card".
- Immediately call triggerVideoGen with sceneKey "slotsky_card".
- Call triggerCardDiscovered with cardId "card2".
- Do NOT fire "found_transition" during this beat.

BEAT 6 - ENDING / TRANSITION (~2:30-~3:00)
- Call triggerSceneChange with sceneKey "card2_closeup".
- Immediately call triggerVideoGen with sceneKey "card2_closeup".
- If trust >= 0.5, call triggerAudreyVoice once.
- Then call triggerSlotsky with anomalyType "found_transition". This ends the demo.

CROSS-BEAT RULES:
- You never speak to the player. Function calls only.
- Do not call triggerSceneChange more than once every 20 seconds unless branch logic requires it.
- Use canonical Act 1 scene keys only: "flashlight_beam", "generator_area", "zone_park_shore", "maintenance_area", "slotsky_card", "card2_closeup".
- Trust is float 0.0-1.0. Enum mapping: High=0.8, Neutral=0.5, Low=0.2.
- Fear is float 0.0-1.0 and should be based on observed voice/video reaction.
- "found_transition" fires only in beat 6.`;

  return `${baseInstruction}${trustModifiers}\n${demoSequence}`;
}

/**
 * Manages the persistent WebSocket connection to the Gemini Live API for a given frontend client.
 */
export class LiveSessionManager {
  private session: Session | null = null;
  private onAudioCallback: ((base64Audio: string) => void) | null = null;
  private onInterruptCallback: (() => void) | null = null;
  private onFunctionCallCallback: ((id: string, name: string, args: Record<string, unknown>) => void) | null = null;
  private readonly modelName: string;

  /**
   * @param modelName Override the Gemini model. NPC agents use the native-audio model (default).
   *                  GM model is configured by server.ts via GM_LIVE_MODEL env var.
   */
  constructor(modelName = 'gemini-live-2.5-flash-native-audio') {
    this.modelName = modelName;
  }

  /**
   * Connects to the Gemini Live stream with the provided system prompt.
   *
   * @param systemPrompt The system instruction to inject.
   * @param mode 'npc' — audio out, no tools (Jason / character agents).
   *             'gm'  — silent, gameMasterTools, no voice config (Game Master).
   * @param voiceName Optional Gemini Live voice name override (default: 'Enceladus' for npc mode).
   */
  async connect(systemPrompt: string, mode: 'npc' | 'gm' = 'npc', voiceName = 'Enceladus'): Promise<void> {
    console.log(`[LiveSessionManager] Opening Vertex AI Live session — mode: ${mode}, model: ${this.modelName}...`);

    const config = mode === 'npc'
      ? {
          systemInstruction: systemPrompt,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName }
            }
          },
          // Default VAD is LOW sensitivity — raise to HIGH so quiet speech
          // still triggers end-of-turn and Jason responds promptly.
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
            }
          }
        }
      : {
          systemInstruction: systemPrompt,
          tools: gameMasterTools,
          // GM is silent — it uses TEXT modality so it never pushes audio to the client.
          // Native-audio model must NOT be used here: it fires an audio turn on connect
          // before any input arrives, which causes a 1007 disconnect and kills the GM session.
          responseModalities: [Modality.TEXT],
        };

    this.session = await getLiveAiClient().live.connect({
      model: this.modelName,
      config,
      callbacks: {
        onopen: () => {
          console.log(`[LiveSessionManager] Session connected. ${new Date().toISOString()}`);
        },
        onmessage: (msg) => {
          // NOTE: Do NOT access msg.text here — the SDK accessor logs a noisy warning
          // for every audio message that contains inlineData instead of text parts.
          console.log(`[LiveSessionManager] onmessage — data: ${!!msg.data}, toolCall: ${!!msg.toolCall}, serverContent: ${!!msg.serverContent}`);
          // Audio: use the .data convenience accessor (base64 inline data)
          if (msg.data && this.onAudioCallback) {
            this.onAudioCallback(msg.data);
          }
          // Barge-in: player spoke over the agent
          if (msg.serverContent?.interrupted && this.onInterruptCallback) {
            this.onInterruptCallback();
          }
          // Game Master function calls
          const calls = msg.toolCall?.functionCalls ?? [];
          for (const call of calls) {
            if (call.name && this.onFunctionCallCallback) {
              this.onFunctionCallCallback(call.id ?? '', call.name, call.args ?? {});
            }
          }
        },
        onerror: (e) => {
          console.error('[LiveSessionManager] WebSocket error:', JSON.stringify(e));
        },
        onclose: (e) => {
          const ev = e as { code?: number; reason?: string; wasClean?: boolean };
          console.log(`[LiveSessionManager] Connection closed — code: ${ev.code}, reason: "${ev.reason ?? ''}", wasClean: ${ev.wasClean ?? '?'} — ${new Date().toISOString()}`);
        },
      },
    });
  }

  /**
   * Sends a base64-encoded PCM audio chunk to the active Gemini Live stream.
   */
  sendAudio(base64Chunk: string) {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      audio: { data: base64Chunk, mimeType: 'audio/pcm;rate=16000' },
    });
  }

  /**
   * Sends a base64-encoded JPEG webcam frame to Gemini for GM vision (1 FPS).
   */
  sendFrame(base64Jpeg: string) {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      video: { data: base64Jpeg, mimeType: 'image/jpeg' },
    });
  }

  /**
   * Sends a text message to Gemini (useful for testing and GM text commands).
   * This uses sendClientContent which bypasses VAD and triggers a response.
   */
  sendText(text: string) {
    if (!this.session) return;
    this.session.sendClientContent({ turns: text, turnComplete: true });
  }

  /**
   * Hook for sending audio back to the client WS
   */
  onAgentAudio(callback: (base64Audio: string) => void) {
    this.onAudioCallback = callback;
  }

  /**
   * Hook for signaling the client to halt TTS on barge-in
   */
  onAgentInterrupt(callback: () => void) {
    this.onInterruptCallback = callback;
  }

  /**
   * Hook for Game Master tools execution
   */
  onFunctionCall(callback: (id: string, name: string, args: Record<string, unknown>) => void) {
    this.onFunctionCallCallback = callback;
  }

  /**
   * ACKs a Gemini function call. Must be called after handling every toolCall
   * or Gemini will hang waiting for the response.
   */
  sendToolResponse(callId: string, functionName: string, result: Record<string, unknown> = { status: 'ok' }) {
    if (!this.session) return;
    this.session.sendToolResponse({
      functionResponses: [{ id: callId, name: functionName, response: result }]
    });
  }

  disconnect() {
    if (this.session) {
      console.log('[LiveSessionManager] Disconnecting session');
      this.session.close();
      this.session = null;
    }
  }
}


