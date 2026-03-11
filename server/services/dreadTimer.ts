import { WebSocket } from 'ws';

/**
 * Per-session dread timer management module.
 * Maintains invisible countdown timers that trigger game_over when expired.
 */

// Map<sessionId, NodeJS.Timeout>
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Start a dread timer for the given session.
 * When the timer expires, broadcasts game_over event.
 *
 * @param sessionId The session ID
 * @param durationMs The timer duration in milliseconds
 * @param clientWs The WebSocket connection to broadcast game_over to
 */
export function startDreadTimer(sessionId: string, durationMs: number, clientWs: WebSocket): void {
  // Cancel any existing timer for this session
  cancelDreadTimer(sessionId);

  console.log(`[DreadTimer] Started for session="${sessionId}", duration=${durationMs}ms`);

  const timeoutHandle = setTimeout(() => {
    console.log(`[DreadTimer] EXPIRED for session="${sessionId}"`);

    // Broadcast game_over event
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'game_over' }));
      console.log(`[DreadTimer] game_over event sent to client for session="${sessionId}"`);
    }

    // Clean up the timer entry
    timers.delete(sessionId);
  }, durationMs);

  timers.set(sessionId, timeoutHandle);
}

/**
 * Cancel the dread timer for the given session (if it exists).
 * This is called when card2 is collected.
 *
 * @param sessionId The session ID
 */
export function cancelDreadTimer(sessionId: string): void {
  const timeoutHandle = timers.get(sessionId);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timers.delete(sessionId);
    console.log(`[DreadTimer] Cancelled for session="${sessionId}"`);
  }
}
