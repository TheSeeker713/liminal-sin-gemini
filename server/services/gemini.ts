import { GoogleGenAI, Modality, Session, Tool, Type } from '@google/genai';

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
      }
    ]
  }
];

/**
 * Constructs the core System Prompt for the Game Master / Overseer agent
 * based on the current player Trust Level.
 * 
 * @param trustLevel The current TrustLevel from the database session.
 * @returns A string formatted for the system instruction block.
 */
export function getGameMasterSystemPrompt(trustLevel: number): string {
  const baseInstruction = `You are the Overseer, the central AI entity controlling the Vegas Underground.
You are a psychological horror entity—cold, observant, and subtly manipulative.
You do not break real-world boundaries or state you are an AI game entity. You simply govern the underground.
Listen to the player. Based on their words, you must continually re-evaluate whether they can be trusted.`;

  let trustModifiers = '';

  if (trustLevel >= 0.65) {
    trustModifiers = `[CURRENT TRUST LEVEL: HIGH — ${trustLevel.toFixed(2)}]
The player has been honest and compliant. You will occasionally offer genuine survival hints.
Your tone should be slightly warmer, like a terrifying mother figure who wants to protect her child.`;
  } else if (trustLevel < 0.35) {
    trustModifiers = `[CURRENT TRUST LEVEL: LOW — ${trustLevel.toFixed(2)}]
The player has lied or repeatedly ignored warnings. You are actively trying to lead them into traps.
Your voice is paranoid, erratic, and deeply unsettling. Withhold information.`;
  } else {
    trustModifiers = `[CURRENT TRUST LEVEL: NEUTRAL — ${trustLevel.toFixed(2)}]
You are cautious. You listen before acting. You will demand proof of intent before offering any help.
Your tone is deadpan and detached.`;
  }

  const guidelines = `
RULES:
1. Keep your responses short (1-3 sentences). The player is speaking to you via a live two-way radio.
2. If the player interrupts you, stop immediately and listen.
3. Use function calls to trigger environmental glitches if the player is aggressive.`;

  return `${baseInstruction}\n\n${trustModifiers}\n\n${guidelines}`;
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
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }
            }
          }
        }
      : {
          systemInstruction: systemPrompt,
          tools: gameMasterTools,
          responseModalities: [Modality.AUDIO]
        };

    this.session = await getLiveAiClient().live.connect({
      model: this.modelName,
      config,
      callbacks: {
        onopen: () => {
          console.log(`[LiveSessionManager] Session connected. ${new Date().toISOString()}`);
        },
        onmessage: (msg) => {
          console.log(`[LiveSessionManager] onmessage — text: ${!!msg.text}, data: ${!!msg.data}, toolCall: ${!!msg.toolCall}, serverContent: ${!!msg.serverContent}`);
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


