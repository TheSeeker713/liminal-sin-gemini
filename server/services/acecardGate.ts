/**
 * Acecard Gate — per-connection acecard keyword timer and card_pickup_02 window.
 *
 * Exports a state-object factory and three functions that previously lived as
 * closures inside the wss.on("connection") handler in server.ts.
 * All connection-scoped state is held in AcecardGateState and passed explicitly.
 */

import type { WebSocket } from "ws";

export type AcecardGateState = {
  acecardKeywordTimer: ReturnType<typeof setTimeout> | null;
  acecardKeywordReceived: boolean;
  cardPickup02Timer: ReturnType<typeof setTimeout> | null;
};

/** Returns a fresh per-connection acecard gate state object. */
export function createAcecardGateState(): AcecardGateState {
  return {
    acecardKeywordTimer: null,
    acecardKeywordReceived: false,
    cardPickup02Timer: null,
  };
}

/**
 * Starts the 30s acecard keyword window (idempotent — safe to call multiple times).
 * Calls onExpire() if the timer fires before a keyword is received.
 */
export function startAcecardKeywordTimer(
  state: AcecardGateState,
  ws: WebSocket,
  sessionId: string,
  onExpire: () => void,
): void {
  if (state.acecardKeywordTimer !== null) return; // idempotent — don't start twice
  ws.send(
    JSON.stringify({
      type: "acecard_keyword_timer_start",
      payload: { durationMs: 30_000 },
    }),
  );
  console.log(`[WS] acecard keyword timer started — session=${sessionId}`);
  state.acecardKeywordTimer = setTimeout(() => {
    state.acecardKeywordTimer = null;
    if (state.acecardKeywordReceived) return;
    console.log(
      `[WS] acecard keyword timer expired — game over — session=${sessionId}`,
    );
    onExpire();
  }, 30_000);
}

/**
 * Handles the GM's triggerAcecardReveal tool call.
 * Cancels the keyword timer and emits acecard_reveal_start to the frontend.
 */
export function handleAcecardReveal(
  state: AcecardGateState,
  ws: WebSocket,
): void {
  if (state.acecardKeywordTimer !== null) {
    clearTimeout(state.acecardKeywordTimer);
    state.acecardKeywordTimer = null;
  }
  state.acecardKeywordReceived = true;
  ws.send(
    JSON.stringify({
      type: "acecard_reveal_start",
      payload: { mediaId: "acecard_reveal_01" },
    }),
  );
  console.log("[WS] acecard_reveal_start sent");
}

/**
 * Starts the 15s card_pickup_02 click window (fires after acecard_reveal_01 clip ends).
 * Calls onExpire() if the timer fires before the player taps the card overlay.
 */
export function startCardPickup02Timer(
  state: AcecardGateState,
  ws: WebSocket,
  sessionId: string,
  onExpire: () => void,
): void {
  ws.send(
    JSON.stringify({
      type: "card_pickup_02_ready",
      payload: { mediaId: "card_pickup_02", durationMs: 15_000 },
    }),
  );
  console.log(`[WS] card_pickup_02 timer started — session=${sessionId}`);
  state.cardPickup02Timer = setTimeout(() => {
    state.cardPickup02Timer = null;
    console.log(
      `[WS] card_pickup_02 timer expired — game over — session=${sessionId}`,
    );
    onExpire();
  }, 15_000);
}

/** Clears all acecard-gate timers. Called on WS close and in clearWildcardTimers(). */
export function clearAcecardTimers(state: AcecardGateState): void {
  if (state.acecardKeywordTimer !== null) {
    clearTimeout(state.acecardKeywordTimer);
    state.acecardKeywordTimer = null;
  }
  if (state.cardPickup02Timer !== null) {
    clearTimeout(state.cardPickup02Timer);
    state.cardPickup02Timer = null;
  }
}
