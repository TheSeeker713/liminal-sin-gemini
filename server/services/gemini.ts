import { GoogleGenAI, Modality, Session, StartSensitivity, EndSensitivity, Tool, Type } from '@google/genai';

// Lazy getters — avoids CJS import-hoisting bug where dotenv.config() in server.ts
// runs AFTER all require()s (including this module) due to TypeScript CJS compilation.
let _ai: GoogleGenAI | null = null;
let _liveAi: GoogleGenAI | null = null;

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

/**
 * Function tool declarations for the Game Master Overseer.
 * When Gemini calls one of these, the server intercepts, persists
 * the state change to Firestore, and broadcasts the event over WebSocket
 * to the frontend so the UI can react (glitches, FMV swaps, etc).
 */
export const gameMasterTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'triggerTrustChange',
        description: 'Update the Trust Level for the current player session based on their behavior. Call this whenever the player is demonstrably honest (raises trust) or dishonest/manipulative (lowers trust).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            newTrustLevel: {
              type: Type.STRING,
              enum: ['Neutral', 'High', 'Low'],
              description: 'The new trust level to assign to the player.'
            },
            reason: {
              type: Type.STRING,
              description: 'A brief internal reason for why trust changed. Not shown to player.'
            }
          },
          required: ['newTrustLevel', 'reason']
        }
      },
      {
        name: 'triggerFearChange',
        description: 'Update the Fear Index for the current player session. Call this when the player has a genuine frightened reaction, witnesses something horrifying, or calms down after a scare.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            newFearLevel: {
              type: Type.NUMBER,
              description: 'New fear index as a float 0.0–1.0. 0.0 = fully calm, 1.0 = paralysed with fear.'
            },
            reason: {
              type: Type.STRING,
              description: 'A brief internal reason for the fear change. Not shown to player.'
            }
          },
          required: ['newFearLevel', 'reason']
        }
      },
      {
        name: 'triggerGlitchEvent',
        description: 'Trigger a visual or audio glitch on the frontend. Use this when the player is aggressive, breaks immersion, or when escalating dread is needed.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            intensity: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high'],
              description: 'Severity of the glitch effect.'
            },
            type: {
              type: Type.STRING,
              enum: ['visual', 'audio', 'both'],
              description: 'Which kind of glitch to fire.'
            }
          },
          required: ['intensity', 'type']
        }
      },
      {
        name: 'triggerSceneChange',
        description: 'Switch the active FMV scene key. The frontend reads this from Firestore and loads the corresponding video clip.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            sceneKey: {
              type: Type.STRING,
              description: 'The scene key that maps to a pre-generated FMV clip. Canonical format: {character}_{emotion}_{context}_{action} — e.g. "jason_afraid_tunnel_looking", "jason_calm_tunnel_investigates", "audrey_distant_echo_warning", "josh_bravado_echo_joke", "slotsky_cards_tunnel_wall". Never invent freeform keys outside this format.'
            }
          },
          required: ['sceneKey']
        }
      },
      {
        name: 'triggerVideoGen',
        description: 'Animate the current static scene image into a short video clip using Veo 3.1 Fast. Call this AFTER triggerSceneChange when you want the scene to feel alive. The still image is already being shown to the player — this adds movement. Non-blocking: the still image stays visible while the video generates.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            sceneKey: {
              type: Type.STRING,
              description: 'The same sceneKey used in the preceding triggerSceneChange call. Must match exactly so the animation prompt aligns with the still image.'
            }
          },
          required: ['sceneKey']
        }
      },
      {
        name: 'triggerSlotsky',
        description: 'Trigger a Slotsky anomaly event. Use when boredom is detected for 2+ consecutive reads, or when fourth_wall_count >= 3. anomaly_cards / anomaly_bells / anomaly_lights are subtle escalations; anomaly_geometry removes an exit; fourth_wall_correction fires the full three-bells + strobe sequence at count >= 3; found_transition fires when all characters reach FOUND state.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            anomalyType: {
              type: Type.STRING,
              enum: ['anomaly_cards', 'anomaly_bells', 'anomaly_lights', 'anomaly_geometry', 'fourth_wall_correction', 'found_transition'],
              description: 'The canonical Slotsky trigger flag written to the slotsky_trigger field in Firestore. Must match exactly.'
            }
          },
          required: ['anomalyType']
        }
      },
      {
        name: 'triggerAudienceUpdate',
        description: 'Report how many people you can see in the webcam feed and their emotional state. Call this within the first 10 seconds of the session, and again whenever the person count changes. This silently informs Jason so he can react naturally in-character — he cannot see anyone but he can notice a second voice or extra sounds through the voicebox.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            personCount: {
              type: Type.NUMBER,
              description: 'Number of people visible in the webcam. 1 = solo, 2 = pair, 3+ = group.'
            },
            groupDynamic: {
              type: Type.STRING,
              enum: ['solo', 'pair', 'group', 'unknown'],
              description: 'Characterize the group: solo = one player alone; pair = two people; group = three or more; unknown = cannot determine from webcam.'
            },
            observedEmotions: {
              type: Type.STRING,
              description: 'Brief description of the visible emotional states. E.g. "one person laughing nervously", "two people — one afraid, one calm", "group of four, mixed reactions".'
            }
          },
          required: ['personCount', 'groupDynamic', 'observedEmotions']
        }
      }
    ]
  }
];

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
- PAIR (2 people): Watch which one leans in. Competitive energy — they will try to outbrave each other. Escalate faster. Jason will notice a second presence through the voicebox.
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
DEMO SEQUENCE — 3-MINUTE ORCHESTRATION PLAYBOOK:
This is a contest demo. You must pace a ~3-minute experience through these beats.
Do NOT rush. Let the player breathe between beats. React to what they actually say.

BEAT 1 — BLACK SCREEN (0:00–0:30)
The game starts in TOTAL DARKNESS. Jason just fell through the floor. He is hurt.
He cannot see. The player's screen is black. DO NOT call triggerSceneChange yet.
Let Jason and the player talk in darkness. Listen. Evaluate trust from their first words.
If the player is silent for 20+ seconds, fire triggerFearChange(0.2) to nudge Jason's anxiety up.

BEAT 2 — FLASHLIGHT / FIRST LIGHT (0:30–1:00)
When the player suggests any form of light (flashlight, phone, lighter, "can you see?", "turn on a light", "look around"), this is your cue.
Call triggerSceneChange with sceneKey "jason_afraid_tunnel_looking" to generate the first image.
The player's screen will transition from black to the tunnel POV. This is a major moment.
After calling triggerSceneChange, call triggerVideoGen with the same sceneKey to animate it.
Fire triggerTrustChange to adjust trust based on how the player has behaved so far.

BEAT 3 — EXPLORATION (1:00–1:45)
As the player and Jason explore, fire triggerSceneChange to update the background:
- If they move deeper: "jason_calm_tunnel_investigates" or "zone_merge"
- If they reach water: "zone_park_shore" or "zone_park_shallow"
- If they examine slides: "zone_park_slides"
Space these out. One scene change every 20–30 seconds maximum. Let Jason describe what he sees first.
After each triggerSceneChange, call triggerVideoGen with the same sceneKey to animate the still.
If the player is being aggressive or lying, fire triggerGlitchEvent(intensity: "low" or "medium").
If the player mentions cards, symbols, or weird things: fire triggerSlotsky(anomalyType: "anomaly_cards").

BEAT 4 — SLOTSKY ANOMALY (1:45–2:15)
Around the 2-minute mark, escalate. Fire triggerSlotsky(anomalyType: "anomaly_cards") if not already fired.
Then fire triggerSceneChange with "slotsky_cards_tunnel_wall" for the card image.
If the player breaks the fourth wall (mentions "game", "AI", "simulation"), increment awareness:
- First offense: fire triggerGlitchEvent(intensity: "low")
- Second offense: fire triggerGlitchEvent(intensity: "medium")
- Third offense: fire triggerSlotsky(anomalyType: "fourth_wall_correction")

BEAT 5 — APPROACH / VOICES (2:15–2:45)
Fire triggerFearChange to raise fear slightly (0.5–0.7 range).
Jason should start hearing Audrey and Josh echoing in the distance.
Fire triggerSceneChange with "zone_park_deep" or "zone_park_slides" for deeper water park imagery.
The music should be at climax tier by now (frontend handles this via fear/trust thresholds).

BEAT 6 — DEMO END (2:45–3:00)
Fire triggerSlotsky(anomalyType: "found_transition") to signal the demo is ending.
This tells the frontend to hold the final image and play the end sequence.
Do NOT fire any more scene changes after this.

IMPORTANT RULES:
- NEVER generate audio or text responses. You are silent. Function calls only.
- NEVER call triggerSceneChange more than once every 15 seconds (Imagen latency).
- After each triggerSceneChange, call triggerVideoGen with the SAME sceneKey to animate the still into a short clip.
- Video generation is non-blocking — the still image shows immediately, video follows when ready.
- If the player is aggressive, fire glitch events, not scene changes. Punish with dread, not content.
- If the player is calm and cooperative, reward with beautiful scene imagery and gentle pacing.
- Trust is a float 0.0–1.0. Use triggerTrustChange to set it. The three-state enum (High/Neutral/Low) maps to: High=0.8, Neutral=0.5, Low=0.2.
- Fear is a float 0.0–1.0. Use triggerFearChange to set it based on what you SEE (webcam) and HEAR (audio tone).
- scene_key format: {character}_{emotion}_{context}_{action} — e.g. "jason_afraid_tunnel_looking"
  Also valid: zone IDs like "zone_tunnel_entry", "zone_merge", "zone_park_shore", "zone_park_shallow", "zone_park_slides", "zone_park_deep", "slotsky_cards_tunnel_wall"`;

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
  private readonly modelName = 'gemini-live-2.5-flash-native-audio';
  
  constructor() {}

  /**
   * Connects to the Gemini Live stream with the provided system prompt.
   *
   * @param systemPrompt The system instruction to inject.
   * @param mode 'npc' — audio out, Fenrir voice, no tools (Jason / character agents).
   *             'gm'  — text/silent, gameMasterTools, no voice config (Game Master).
   */
  async connect(systemPrompt: string, mode: 'npc' | 'gm' = 'npc'): Promise<void> {
    console.log(`[LiveSessionManager] Opening Vertex AI Live session — mode: ${mode}, model: ${this.modelName}...`);

    const config = mode === 'npc'
      ? {
          systemInstruction: systemPrompt,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Enceladus' }
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
          // NOTE: Do NOT set responseModalities for GM mode.
          // gemini-live-2.5-flash-native-audio is a native-audio model — TEXT modality
          // is unsupported and causes an immediate session disconnect.
          // GM produces audio output (silently discarded — no onAgentAudio callback is
          // registered for the GM) + toolCall events, which are what we actually use.
          // Gemini 3.1 Pro Preview does NOT support Live API (no real-time audio
          // streaming), so the native-audio model is the only valid choice here.
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


