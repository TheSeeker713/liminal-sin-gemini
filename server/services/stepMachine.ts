/**
 * Step Machine — canonical Act 1 step sequence data.
 *
 * Exports pure data and pure functions only — no WS, no session state,
 * no Gemini references. Consumed by the autoplay advance interval in server.ts.
 */

export type TriggerType = "chained_auto" | "hold_for_input";

export type StepMediaEntry = {
  mediaId: string;
  triggerType: TriggerType;
  timeoutSeconds: number;
};

/** Canonical per-step media metadata. Step numbers match the server.ts step machine. */
export const STEP_MEDIA_TRIGGER: Record<number, StepMediaEntry> = {
  // ── Tunnel sequence (flashlight chain) ───────────────────────────────────────
  8:  { mediaId: "flashlight_sweep_01",  triggerType: "chained_auto",    timeoutSeconds: 11 },
  9:  { mediaId: "tunnel_flashlight_01", triggerType: "chained_auto",    timeoutSeconds: 16 },
  10: { mediaId: "tunnel_generator_01",  triggerType: "hold_for_input",  timeoutSeconds: 30 },
  // ── Card joker → card1 hold ──────────────────────────────────────────────────
  11: { mediaId: "card_joker_01",        triggerType: "hold_for_input",  timeoutSeconds: 90 },
  // ── Park sequence (post-WILDCARD1 chain) ─────────────────────────────────────
  12: { mediaId: "tunnel_transition_01", triggerType: "chained_auto",    timeoutSeconds: 16 },
  13: { mediaId: "park_reveal_01",       triggerType: "chained_auto",    timeoutSeconds: 16 },
  14: { mediaId: "park_walkway_01",      triggerType: "chained_auto",    timeoutSeconds: 11 },
  15: { mediaId: "park_walkway_02",      triggerType: "chained_auto",    timeoutSeconds: 16 },
  16: { mediaId: "park_liminal_01",      triggerType: "hold_for_input",  timeoutSeconds: 30 },
  // ── Maintenance → elevator sequence ──────────────────────────────────────────
  17: { mediaId: "maintenance_reveal_01", triggerType: "chained_auto",   timeoutSeconds: 16 },
  18: { mediaId: "shaft_maintenance_01", triggerType: "chained_auto",    timeoutSeconds: 11 },
  19: { mediaId: "elevator_entry_01",    triggerType: "hold_for_input",  timeoutSeconds: 30 },
  // ── Elevator → hallway sequence ──────────────────────────────────────────────
  20: { mediaId: "elevator_inside_01",   triggerType: "chained_auto",    timeoutSeconds: 6 },
  21: { mediaId: "elevator_inside_02",   triggerType: "chained_auto",    timeoutSeconds: 16 },
  22: { mediaId: "hallway_pov_01",       triggerType: "chained_auto",    timeoutSeconds: 11 },
  23: { mediaId: "hallway_pov_02",       triggerType: "hold_for_input",  timeoutSeconds: 30 },
};

/** Returns the hold-timeout in seconds for a given step (default 30s). */
export function getStepTimeoutSeconds(step: number): number {
  return STEP_MEDIA_TRIGGER[step]?.timeoutSeconds ?? 30;
}

const STEP_TRANSITIONS: Record<number, number> = {
  7: 8, 8: 9, 9: 10, 10: 11,
  // 11 is terminal — card_collected handler owns progression
  12: 13, 13: 14, 14: 15, 15: 16, 16: 17, 17: 18, 18: 19, 19: 20,
  20: 21, 21: 22, 22: 23,
  // 23 is terminal — acecard gate owns progression
};

/** Returns the next step in the canonical Act 1 sequence for a given fromStep. */
export function getNextAutoplayStep(fromStep: number): number {
  return STEP_TRANSITIONS[fromStep] ?? fromStep + 1;
}

export type GmCallEntry = {
  fnName: string;
  args: Record<string, unknown>;
};

/**
 * Optional side-effect tag — handled in server.ts using connection-scoped state.
 * "card1_auto_pick"       — start the 60s card1 auto-collect fallback timer.
 * "card2_hunt_and_prewarm" — kick wildcard game_over + good_ending pre-gen; clear card2AutoPickTimer.
 * "hallway_pov_02_acecard" — start the acecard keyword gate timer.
 */
export type StepExtra =
  | "card1_auto_pick"
  | "card2_hunt_and_prewarm"
  | "hallway_pov_02_acecard"
  | "hallway_pov_02_all"; // card2_hunt_and_prewarm + hallway_pov_02_acecard combined

export type StepAutoplayAction = {
  autoplayText: string;
  gmCalls: GmCallEntry[];
  extra?: StepExtra;
};

/**
 * Autoplay dispatch table — keyed by fromStep.
 * Pure data. No WS or session references. All GM function names are strings.
 */
export const STEP_AUTOPLAY_ACTIONS: Record<number, StepAutoplayAction> = {
  // ── Tunnel sequence ──────────────────────────────────────────────────────────
  7: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You decide to turn on your flashlight and start scanning the darkness.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "flashlight_beam" } },
    ],
  },
  8: {
    autoplayText:
      "[AUTOPLAY: The flashlight beam sweeps deeper into the tunnel.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "flashlight_scanning" } },
    ],
  },
  9: {
    autoplayText:
      "[AUTOPLAY: Up ahead in the tunnel there is a large industrial generator.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "generator_area_start" } },
    ],
  },
  10: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You start the generator, the tunnel lights come on, and something appears on the floor by the machine.]",
    gmCalls: [
      { fnName: "triggerSceneChange",    args: { sceneKey: "generator_card_reveal" } },
    ],
    extra: "card1_auto_pick",
  },
  // Step 11 is terminal — card_collected handler owns progression past here
  // ── Park sequence (post-WILDCARD1, triggered by wildcard end timer) ──────────
  12: {
    autoplayText:
      "[AUTOPLAY: The tunnel opens into an impossible space ahead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_transition_reveal" } },
    ],
  },
  13: {
    autoplayText:
      "[AUTOPLAY: You step into the waterpark. It stretches in every direction.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_entrance" } },
    ],
  },
  14: {
    autoplayText:
      "[AUTOPLAY: You follow the walkways deeper into the park.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_walkway" } },
    ],
  },
  15: {
    autoplayText:
      "[AUTOPLAY: You pass through the liminal area toward the far edge of the park.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_liminal" } },
    ],
  },
  // ── Maintenance → Elevator ───────────────────────────────────────────────────
  16: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You notice something in the distance — what looks like a maintenance area.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "maintenance_reveal" } },
    ],
  },
  17: {
    autoplayText:
      "[AUTOPLAY: You approach the maintenance shaft entrance.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_shaft_view" } },
    ],
  },
  18: {
    autoplayText:
      "[AUTOPLAY: The elevator doors are ahead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "maintenance_entry" } },
    ],
  },
  19: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You step into the elevator and the doors close behind you.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "elevator_inside" } },
    ],
  },
  // ── Elevator → Hallway ───────────────────────────────────────────────────────
  20: {
    autoplayText:
      "[AUTOPLAY: The elevator carries you down. Steel walls close in around you.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "elevator_inside_2" } },
    ],
  },
  21: {
    autoplayText:
      "[AUTOPLAY: Descent continues. The maintenance level comes into view below.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "maintenance_panel" } },
    ],
  },
  22: {
    autoplayText:
      "[AUTOPLAY: You reach the maintenance corridor. Something moves at the far end. The clock is running.]",
    gmCalls: [
      { fnName: "triggerSceneChange",    args: { sceneKey: "hallway_pov_02" } },
      { fnName: "triggerDreadTimerStart", args: { durationMs: 30_000 } },
    ],
    extra: "hallway_pov_02_all",
  },
  // Step 23 is terminal — acecard gate owns progression past here
};
