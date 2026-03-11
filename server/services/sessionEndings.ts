import { WebSocket } from 'ws';
import { LiveSessionManager } from './gemini';
import { cancelDreadTimer } from './dreadTimer';

/**
 * Session ending handlers: card collection logic, SITUATION_UPDATE injection,
 * and good_ending emission.
 */

export const CARD1_SITUATION_UPDATE_TEMPLATE = `[SITUATION_UPDATE: GM_VISION — You have a sudden disorienting flash of partial sight
through the device. You sense — or see — the person on the other end for one moment.
Describe exactly ONE specific visual detail about them: what they are wearing, their
hair, one concrete thing you noticed. Then ask: "Are you wearing a ___?" or
"I saw— are you [descriptive detail]?" React as if this is real and shocking.
One moment of recognition, then it is gone. Maximum 2 sentences total.]`;

/**
 * Handle the card_collected event from the frontend.
 * Routes to card1 or card2 logic based on cardId.
 *
 * @param cardId 'card1' or 'card2'
 * @param sessionId The session ID
 * @param jasonManager The Jason NPC session manager instance
 * @param clientWs The WebSocket connection
 */
export async function handleCardCollected(
  cardId: string,
  sessionId: string,
  jasonManager: LiveSessionManager,
  clientWs: WebSocket
): Promise<void> {
  console.log(`[SessionEndings] card_collected received: cardId="${cardId}", sessionId="${sessionId}"`);

  if (cardId === 'card1') {
    // Card 1 (Jack of Clubs) collected in Phase 5B
    // Inject SITUATION_UPDATE into Jason
    console.log(`[SessionEndings] Injecting SITUATION_UPDATE for card1 collection`);
    jasonManager.sendText(CARD1_SITUATION_UPDATE_TEMPLATE);
  } else if (cardId === 'card2') {
    // Card 2 (Queen of Spades) collected in Phase 8
    // Cancel dread timer + emit good_ending
    console.log(`[SessionEndings] Cancelling dread timer for card2 collection`);
    cancelDreadTimer(sessionId);

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'good_ending' }));
      console.log(`[SessionEndings] good_ending event sent to client for session="${sessionId}"`);
    }

    // Optional: Log session completion to Firestore (deferred for now)
    // await logSessionEnd(sessionId, 'good_ending');
  }
}
