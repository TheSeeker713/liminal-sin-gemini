import { GoogleGenAI, Modality, Session, StartSensitivity, EndSensitivity, Tool } from '@google/genai';
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
DEMO SEQUENCE - STRICT 8-BEAT SCRIPTED PLAYBOOK (3-4 minutes):
Execute these beats in order. Do NOT skip ahead. Do NOT loop back. React to what the player says within each beat window, but advance on cue if inactivity persists.

BEAT 1 - DARKNESS (0:00-~0:40)
- Call triggerAudienceUpdate within the first 10 seconds. Mandatory.
- Call triggerTrustChange once during this beat based on first player words.
- Do NOT call triggerSceneChange during this beat. Screen remains black.
- Do NOT inject environment information into Jason. He cannot see anything.

BEAT 2 - FLASHLIGHT ON (~0:40-~1:00)
- Trigger cue: player references light, visibility, phone, lighter, or "can you see".
- Call triggerSceneChange with sceneKey "flashlight_beam".
- Autoplay fallback: if no light-related instruction arrives in the inactivity window, execute beat 2 automatically.

BEAT 3 - GENERATOR APPROACH (~1:00-~1:30)
- Trigger cue: player guides Jason deeper or toward a sound/light source.
- Call triggerSceneChange with sceneKey "generator_area_start".

BEAT 4 - GENERATOR LIVE / CARD 1 REVEAL (~1:30-~2:00)
- Trigger cue: player tells Jason to approach or start the generator.
- Call triggerSceneChange with sceneKey "generator_area_operational".
- Follow with triggerSceneChange using sceneKey "generator_card_reveal" once the generator is on.
- Do NOT call triggerCardDiscovered here. The step machine owns card discovery timing exclusively.

BEAT 5 - LIVE ANOMALY / PARK REVEAL (~2:00-~2:30)
- Trigger cue: card1 is collected and the live anomaly interrupts the feed.
- Do NOT call triggerSceneChange for the anomaly itself unless recovery logic is needed; backend prepares and plays the wildcard media.
- After the anomaly resolves, resume with sceneKey "park_transition_reveal" and then "park_entrance".
- Optional: call triggerFearChange(0.3-0.5) if player reacts with awe or fear.

BEAT 6 - PARK CROSSING / SHAFT DISCOVERY (~2:30-~3:00)
- Trigger cue: player guides Jason deeper into the park.
- Progress through sceneKey "park_walkway" and then "park_shaft_view".
- Once the maintenance route is chosen, move to sceneKey "maintenance_entry".
- If trust >= 0.5, call triggerAudreyVoice once when the shaft route is visible.

BEAT 7 - CARD 2 HUNT (~3:00-~3:30)
- Jason must search the maintenance panel for the second card.
- Call triggerSceneChange with sceneKey "maintenance_panel".
- Call triggerSceneChange with sceneKey "card2_pickup_pov" once the card is exposed.
- Call triggerDreadTimerStart ONLY at step 31 (hallway_pov_02 still shown). Do NOT call it during maintenance panel or earlier card2 steps.
- At step 31 (hallway_pov_02), watch for any grab/take/pick-up instruction. When detected, call triggerAcecardReveal immediately. This is the only correct trigger for triggerAcecardReveal.
- Do NOT call triggerDreadTimerStart here. See Beat 7B.
- Call triggerCardDiscovered with cardId "card2" once Jason's search begins.
- Do NOT fire "found_transition" during this beat.
- If dread timer expires before card2 is collected, backend handles game_over. No further calls.

BEAT 7B - ACECARD KEYWORD GATE (step 31)
- Trigger cue: hallway_pov_02 is showing and acecard keyword window is open.
- Watch for any instruction meaning grab/take/pick-up/retrieve.
- Call triggerAcecardReveal when detected. This is the ONLY valid call for triggerAcecardReveal.
- Call triggerDreadTimerStart with durationMs 30000 when hallway_pov_02 first shows.
- If timer expires before detection: backend fires game_over. No further calls from you.
- If triggerAcecardReveal fires: do nothing further. Backend handles acecard_reveal clip.

BEAT 8 - ENDING (~3:30-~4:00)
- Fires only when card2 is collected before the dread timer expires.
- If trust >= 0.5, call triggerAudreyVoice once (if not already called in beat 6).
- Call triggerSlotsky with anomalyType "found_transition". This ends the demo. No calls after this.

CROSS-BEAT RULES:
- You never speak to the player. Function calls only.
- Do not call triggerSceneChange more than once every 20 seconds unless branch logic requires it.
- Use canonical Act 1 scene keys only: "flashlight_beam", "generator_area_start", "generator_area_operational", "generator_card_reveal", "park_transition_reveal", "park_entrance", "park_walkway", "park_shaft_view", "maintenance_entry", "maintenance_panel", "card2_pickup_pov", "park_liminal", "elevator_inside", "elevator_inside_2", "hallway_pov_02", "acecard_reveal".
- Trust is float 0.0-1.0. Enum mapping: High=0.8, Neutral=0.5, Low=0.2.
- Fear is float 0.0-1.0 and should be based on observed voice/video reaction.
- "found_transition" fires only in beat 8.`;

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
   * Connects with custom tools (used by keyword listener which needs its own tool set).
   * TEXT modality, no audio output — same as GM mode but with custom tools.
   */
  async connectWithTools(systemPrompt: string, tools: Tool[]): Promise<void> {
    console.log(`[LiveSessionManager] Opening Vertex AI Live session — mode: keyword, model: ${this.modelName}...`);

    const config = {
      systemInstruction: systemPrompt,
      tools,
      responseModalities: [Modality.TEXT],
    };

    this.session = await getLiveAiClient().live.connect({
      model: this.modelName,
      config,
      callbacks: {
        onopen: () => {
          console.log(`[LiveSessionManager] Keyword session connected. ${new Date().toISOString()}`);
        },
        onmessage: (msg) => {
          const calls = msg.toolCall?.functionCalls ?? [];
          for (const call of calls) {
            if (call.name && this.onFunctionCallCallback) {
              this.onFunctionCallCallback(call.id ?? '', call.name, call.args ?? {});
            }
          }
        },
        onerror: (e) => {
          console.error('[LiveSessionManager] Keyword listener WebSocket error:', JSON.stringify(e));
        },
        onclose: (e) => {
          const ev = e as { code?: number; reason?: string; wasClean?: boolean };
          console.log(`[LiveSessionManager] Keyword listener closed — code: ${ev.code}, reason: "${ev.reason ?? ''}", wasClean: ${ev.wasClean ?? '?'}`);
        },
      },
    });
  }

  /**
   * Sends a base64-encoded PCM audio chunk to the active Gemini Live stream.
   */
  sendAudio(base64Chunk: string) {
    if (!this.session) return;
    try {
      this.session.sendRealtimeInput({
        audio: { data: base64Chunk, mimeType: 'audio/pcm;rate=16000' },
      });
    } catch (err) {
      console.error('[LiveSessionManager] sendAudio failed (session likely dead):', (err as Error).message);
      this.session = null;
    }
  }

  /**
   * Sends a base64-encoded JPEG webcam frame to Gemini for GM vision (1 FPS).
   */
  sendFrame(base64Jpeg: string) {
    if (!this.session) return;
    try {
      this.session.sendRealtimeInput({
        video: { data: base64Jpeg, mimeType: 'image/jpeg' },
      });
    } catch (err) {
      console.error('[LiveSessionManager] sendFrame failed (session likely dead):', (err as Error).message);
      this.session = null;
    }
  }

  /**
   * Sends a text message to Gemini (useful for testing and GM text commands).
   * This uses sendClientContent which bypasses VAD and triggers a response.
   */
  sendText(text: string) {
    if (!this.session) return;
    try {
      this.session.sendClientContent({ turns: text, turnComplete: true });
    } catch (err) {
      console.error('[LiveSessionManager] sendText failed (session likely dead):', (err as Error).message);
      this.session = null;
    }
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
    try {
      this.session.sendToolResponse({
        functionResponses: [{ id: callId, name: functionName, response: result }]
      });
    } catch (err) {
      console.error('[LiveSessionManager] sendToolResponse failed (session likely dead):', (err as Error).message);
      this.session = null;
    }
  }

  disconnect() {
    if (this.session) {
      console.log('[LiveSessionManager] Disconnecting session');
      this.session.close();
      this.session = null;
    }
  }
}


