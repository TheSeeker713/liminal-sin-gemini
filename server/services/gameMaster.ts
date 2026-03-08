import { WebSocket } from 'ws';
import { updateTrustLevel } from './db';
import { GmEvent } from '../types/state';

/**
 * Handles a function call dispatched by the Gemini Game Master.
 * Persists the state change to Firestore and broadcasts the event
 * over WebSocket to the connected frontend client.
 */
export async function handleGmFunctionCall(
  sessionId: string,
  functionName: string,
  args: Record<string, unknown>,
  clientWs: WebSocket
): Promise<void> {
  console.log(`[GM] Function call: ${functionName}`, args);

  let event: GmEvent | null = null;

  switch (functionName) {
    case 'triggerTrustChange': {
      const levelMap: Record<string, number> = { High: 0.8, Neutral: 0.5, Low: 0.2 };
      const newLevel = levelMap[args.newTrustLevel as string] ?? 0.5;
      await updateTrustLevel(sessionId, newLevel);
      event = {
        type: 'TRUST_CHANGE',
        sessionId,
        payload: { trustLevel: newLevel, reason: args.reason },
        timestamp: Date.now()
      };
      break;
    }

    case 'triggerGlitchEvent': {
      event = {
        type: 'GLITCH_EVENT',
        sessionId,
        payload: { intensity: args.intensity, glitchType: args.type },
        timestamp: Date.now()
      };
      break;
    }

    case 'triggerSceneChange': {
      event = {
        type: 'SCENE_CHANGE',
        sessionId,
        payload: { sceneKey: args.sceneKey },
        timestamp: Date.now()
      };
      break;
    }

    case 'triggerSlotsky': {
      event = {
        type: 'SLOTSKY_TRIGGER',
        sessionId,
        payload: { anomalyType: args.anomalyType },
        timestamp: Date.now()
      };
      break;
    }

    default:
      console.warn(`[GM] Unknown function call received: ${functionName}`);
      return;
  }

  if (event && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify(event));
    console.log(`[GM] Broadcast event to client: ${event.type}`);
  }
}
