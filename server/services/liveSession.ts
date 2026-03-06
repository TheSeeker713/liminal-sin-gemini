import { WebSocket } from 'ws';
import { Modality } from '@google/genai';
import { ai, gameMasterTools } from './gemini';
import { handleGmFunctionCall } from './gameMaster';

/**
 * Gemini Live API model for Vertex AI.
 * Uses the latest live-capable preview model.
 */
const LIVE_MODEL = 'gemini-2.0-flash-live-preview-04-09';

/**
 * A handle returned to server.ts so it can feed audio in
 * and cleanly close the session when the WS client disconnects.
 */
export interface LiveSessionHandle {
  sendAudio: (pcmBuffer: Buffer) => void;
  close: () => void;
}

/**
 * Opens a Gemini Live session for a connected browser client.
 *
 * - Streams Gemini audio output back to the browser over the WebSocket.
 * - Intercepts GM function calls and routes them to handleGmFunctionCall().
 *
 * @param sessionId  Firestore session ID for this player.
 * @param systemPrompt  Full system instruction string (built from getGameMasterSystemPrompt).
 * @param clientWs  The browser's WebSocket connection.
 * @returns A handle with sendAudio() and close() methods.
 */
export async function openLiveSession(
  sessionId: string,
  systemPrompt: string,
  clientWs: WebSocket
): Promise<LiveSessionHandle> {
  console.log(`[LIVE] Opening Gemini Live session for ${sessionId}`);

  const session = await ai.live.connect({
    model: LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: systemPrompt,
      tools: gameMasterTools,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' }
        }
      }
    },
    callbacks: {
      onopen: () => {
        console.log(`[LIVE] Session ready for ${sessionId}`);
      },

      onmessage: (message) => {
        // ── Audio output: forward PCM chunks to the browser ──────────────
        const parts = message.serverContent?.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
            const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
            clientWs.send(audioBuffer);
          }
        }

        // ── Function calls: route to Game Master handler ──────────────────
        const functionCalls = message.toolCall?.functionCalls ?? [];
        for (const fc of functionCalls) {
          handleGmFunctionCall(
            sessionId,
            fc.name ?? '',
            (fc.args ?? {}) as Record<string, unknown>,
            clientWs
          );
        }
      },

      onerror: (e) => {
        console.error(`[LIVE] Session error for ${sessionId}:`, e);
      },

      onclose: () => {
        console.log(`[LIVE] Session closed for ${sessionId}`);
      }
    }
  });

  return {
    /**
     * Forward a raw PCM audio Buffer from the browser to Gemini.
     * Expected format: 16-bit PCM, 16kHz, mono (LINEAR16).
     */
    sendAudio: (pcmBuffer: Buffer) => {
      session.sendRealtimeInput({
        audio: {
          data: pcmBuffer.toString('base64'),
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    },

    close: () => {
      session.close();
    }
  };
}
