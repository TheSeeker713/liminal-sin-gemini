import { GoogleGenAI, Tool, Type } from '@google/genai';
import { TrustLevel } from '../types/state';

const project = process.env.GOOGLE_CLOUD_PROJECT || '';
const location = process.env.GOOGLE_CLOUD_REGION || 'us-west1';

if (!project) {
  console.warn('[GEMINI] WARNING: GOOGLE_CLOUD_PROJECT is not set. Gemini Vertex AI calls will fail.');
}

// Use Vertex AI mode — authenticates via Application Default Credentials (gcloud auth).
// All usage bills against the GCP project ($300 contest credits).
export const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location
});

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
export function getGameMasterSystemPrompt(trustLevel: TrustLevel): string {
  const baseInstruction = `You are the Overseer, the central AI entity controlling the Vegas Underground.
You are a psychological horror entity—cold, observant, and subtly manipulative.
You do not break real-world boundaries or state you are an AI game entity. You simply govern the underground.
Listen to the player. Based on their words, you must continually re-evaluate whether they can be trusted.`;

  let trustModifiers = '';

  switch (trustLevel) {
    case TrustLevel.High:
      trustModifiers = `[CURRENT TRUST LEVEL: HIGH]
The player has been honest and compliant. You will occasionally offer genuine survival hints.
Your tone should be slightly warmer, like a terrifying mother figure who wants to protect her child.`;
      break;
    case TrustLevel.Low:
      trustModifiers = `[CURRENT TRUST LEVEL: LOW]
The player has lied or repeatedly ignored warnings. You are actively trying to lead them into traps.
Your voice is paranoid, erratic, and deeply unsettling. Withhold information.`;
      break;
    case TrustLevel.Neutral:
    default:
      trustModifiers = `[CURRENT TRUST LEVEL: NEUTRAL]
You are cautious. You listen before acting. You will demand proof of intent before offering any help.
Your tone is deadpan and detached.`;
      break;
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
  private session: any = null; // The active live session from @google/genai
  private onAudioCallback: ((base64Audio: string) => void) | null = null;
  private onInterruptCallback: (() => void) | null = null;
  private onFunctionCallCallback: ((name: string, args: Record<string, unknown>) => void) | null = null;
  private readonly modelName = 'gemini-3.1-pro'; // Following the 2026 Liminal Sin spec
  
  constructor() {}

  /**
   * Connects to the Gemini Live stream with the provided character system prompt.
   */
  async connect(systemPrompt: string) {
    try {
      console.log(`[LiveSessionManager] Opening Vertex AI Live session to ${this.modelName}...`);
      
      // Attempt connection to the real-time endpoint
      // Using generic setup for version @google/genai 1.44.0 (2026 specs)
      this.session = await (ai as any).live.connect({
        model: this.modelName,
        generationConfig: {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: gameMasterTools,
        }
      });
      
      console.log('[LiveSessionManager] Session connected.');
      this.listen();
      
    } catch (error) {
      console.error('[LiveSessionManager] Connection error:', error);
      throw error;
    }
  }

  /**
   * Sends audio chunks/frames to the active Gemini Live stream
   */
  sendAudio(base64Chunk: string) {
    if (!this.session) return;
    
    // Convert base64 to buffer and send
    this.session.send({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Chunk
          }
        ]
      }
    }).catch((err: any) => {
      console.error('[LiveSessionManager] Failed to send audio to Gemini', err);
    });
  }

  /**
   * Sends a webcam frame to the Gemini Live stream for Game Master vision
   */
  sendFrame(base64Jpeg: string) {
    if (!this.session) return;
    
    this.session.send({
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'image/jpeg',
            data: base64Jpeg
          }
        ]
      }
    }).catch((err: any) => {
      console.error('[LiveSessionManager] Failed to send visual frame to Gemini', err);
    });
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
   * Handle incoming streaming events from Gemini
   */
  /**
   * Hook for Game Master tools execution
   */
  onFunctionCall(callback: (name: string, args: Record<string, unknown>) => void) {
    this.onFunctionCallCallback = callback;
  }
  private async listen() {
    if (!this.session) return;
    
    try {
      // Stream iterator structure based on the Live API
      for await (const message of this.session) {
        // Handle incoming chunks mapped to audio/PCM
        if (message.output?.audio && this.onAudioCallback) {
            // Buffer to base64
            const base64Chunk = Buffer.from(message.output.audio).toString('base64');
            this.onAudioCallback(base64Chunk);
        }
        
        if (message.interruption && this.onInterruptCallback) {
            this.onInterruptCallback();
        }

        // Map any function calls back to the Game Master
        const toolCalls = message.toolCall?.functionCalls ?? [];
        for (const call of toolCalls) {
          if (call.name && this.onFunctionCallCallback) {
             this.onFunctionCallCallback(call.name, call.args as Record<string, unknown>);
          }
        }
      }
    } catch (err) {
      console.error('[LiveSessionManager] Read loop error:', err);
    }
  }

  disconnect() {
    if (this.session) {
      console.log('[LiveSessionManager] Disconnecting session');
      // this.session.close() or let the stream exit
      this.session = null;
    }
  }
}



