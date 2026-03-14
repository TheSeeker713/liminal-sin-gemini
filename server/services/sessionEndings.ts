import { WebSocket } from "ws";
import { LiveSessionManager } from "./gemini";
import { cancelDreadTimer } from "./dreadTimer";

/**
 * Session ending handlers: card collection logic, SITUATION_UPDATE injection,
 * and good_ending emission.
 */

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
  clientWs: WebSocket,
  options?: { deferGoodEnding?: boolean },
): Promise<void> {
  console.log(
    `[SessionEndings] card_collected received: cardId="${cardId}", sessionId="${sessionId}"`,
  );

  if (cardId === "card1") {
    // Card 1 collection now resolves into the wildcard live-feed pipeline.
    console.log(
      `[SessionEndings] card1 collected - wildcard live-feed pipeline should follow`,
    );
  } else if (cardId === "card2") {
    // Card 2 (Queen of Spades) collected in Phase 8
    // Cancel dread timer + emit good_ending
    console.log(`[SessionEndings] Cancelling dread timer for card2 collection`);
    cancelDreadTimer(sessionId);

    if (!options?.deferGoodEnding && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "good_ending" }));
      console.log(
        `[SessionEndings] good_ending event sent to client for session="${sessionId}"`,
      );
    }

    // Optional: Log session completion to Firestore (deferred for now)
    // await logSessionEnd(sessionId, 'good_ending');
  }
}
