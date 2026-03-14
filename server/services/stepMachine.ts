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
  // ── Tunnel sequence ──────────────────────────────────────────────────────────
  7:  { mediaId: "tunnel_flashlight_01",  triggerType: "chained_auto",    timeoutSeconds: 30 }, // clips chain → generator
  9:  { mediaId: "tunnel_generator_01",   triggerType: "chained_auto",    timeoutSeconds: 30 }, // generator_area_start clip
  11: { mediaId: "tunnel_generator_01",   triggerType: "hold_for_input",  timeoutSeconds: 30 }, // generator_area_operational — STILL hold
  13: { mediaId: "card_joker_01",         triggerType: "hold_for_input",  timeoutSeconds: 30 }, // joker card — STILL hold
  // ── Park sequence ────────────────────────────────────────────────────────────
  17: { mediaId: "tunnel_transition_01",  triggerType: "hold_for_input",  timeoutSeconds: 30 }, // transition — STILL hold (start)
  19: { mediaId: "park_reveal_01",        triggerType: "chained_auto",    timeoutSeconds: 30 },
  21: { mediaId: "park_walkway_01",       triggerType: "chained_auto",    timeoutSeconds: 30 },
  23: { mediaId: "park_walkway_02",       triggerType: "chained_auto",    timeoutSeconds: 30 },
  24: { mediaId: "park_liminal_01",       triggerType: "hold_for_input",  timeoutSeconds: 30 }, // liminal — STILL hold
  // ── Maintenance sequence ─────────────────────────────────────────────────────
  25: { mediaId: "maintenance_reveal_01", triggerType: "chained_auto",    timeoutSeconds: 30 }, // maintenance corridor clip
  26: { mediaId: "shaft_maintenance_01",  triggerType: "chained_auto",    timeoutSeconds: 30 }, // shaft clip → elevator entry STILL
  27: { mediaId: "elevator_entry_01",     triggerType: "hold_for_input",  timeoutSeconds: 30 }, // elevator entry — STILL hold
  // ── Elevator/hallway sequence ────────────────────────────────────────────────
  28: { mediaId: "elevator_inside_01",    triggerType: "chained_auto",    timeoutSeconds: 30 }, // inside clips chain
  29: { mediaId: "elevator_inside_02",    triggerType: "chained_auto",    timeoutSeconds: 30 },
  30: { mediaId: "hallway_pov_01",        triggerType: "chained_auto",    timeoutSeconds: 30 }, // hallway clip → hallway_pov_02 STILL
  31: { mediaId: "hallway_pov_02",        triggerType: "hold_for_input",  timeoutSeconds: 30 }, // hallway_pov_02 — STILL hold + game_over timer
};

/** Returns the hold-timeout in seconds for a given step (default 30s). */
export function getStepTimeoutSeconds(step: number): number {
  return STEP_MEDIA_TRIGGER[step]?.timeoutSeconds ?? 30;
}

const STEP_TRANSITIONS: Record<number, number> = {
  7: 9, 9: 11, 11: 13, 13: 17, 17: 19, 19: 21,
  21: 23, 23: 24, 24: 25, 25: 26, 26: 27, 27: 28, 28: 29, 29: 30, 30: 31,
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
  7: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You decide to turn on your flashlight and start scanning the darkness.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "flashlight_beam" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "flashlight_beam" } },
    ],
  },
  9: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You push farther down the tunnel and a generator comes into view ahead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "generator_area_start" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "generator_area_start" } },
    ],
  },
  11: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You walk toward the generator at the end of the tunnel.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "generator_area_operational" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "generator_area_operational" } },
    ],
  },
  13: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You start the generator, the tunnel lights come on, and something appears on the floor by the machine.]",
    gmCalls: [
      { fnName: "triggerSceneChange",    args: { sceneKey: "generator_card_reveal" } },
      { fnName: "triggerCardDiscovered", args: { cardId: "card1" } },
    ],
    extra: "card1_auto_pick",
  },
  17: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You keep moving and the tunnel opens toward something impossible ahead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_transition_reveal" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "park_transition_reveal" } },
    ],
  },
  19: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You step through the breach and the whole park opens up in front of you.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_entrance" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "park_entrance" } },
    ],
  },
  21: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You follow the walkways deeper into the park.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_walkway" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "park_walkway" } },
    ],
  },
  23: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You pass through the liminal area between the waterpark and the shaft entrance.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_liminal" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "park_liminal" } },
    ],
  },
  24: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You move toward the maintenance shaft entrance at the far edge of the park.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "park_shaft_view" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "park_shaft_view" } },
    ],
  },
  25: {
    autoplayText:
      "[AUTOPLAY: Entering the maintenance corridor. Fluorescent lights flicker overhead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "maintenance_entry" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "maintenance_entry" } },
    ],
  },
  26: {
    autoplayText:
      "[AUTOPLAY: Moving through the shaft access passage. The elevator doors are ahead.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "maintenance_entry" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "maintenance_entry" } },
    ],
  },
  27: {
    autoplayText:
      "[AUTOPLAY_TIMEOUT: No player response. You step into the elevator and the doors close behind you.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "elevator_inside" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "elevator_inside" } },
    ],
  },
  28: {
    autoplayText:
      "[AUTOPLAY: The elevator carries you down. Steel walls close in around you.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "elevator_inside" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "elevator_inside" } },
    ],
  },
  29: {
    autoplayText:
      "[AUTOPLAY: Descent continues. The maintenance level comes into view below.]",
    gmCalls: [
      { fnName: "triggerSceneChange", args: { sceneKey: "elevator_inside_2" } },
      { fnName: "triggerVideoGen",    args: { sceneKey: "elevator_inside_2" } },
    ],
  },
  30: {
    autoplayText:
      "[AUTOPLAY: You reach the maintenance corridor. Something moves at the far end. The clock is running.]",
    gmCalls: [
      { fnName: "triggerSceneChange",    args: { sceneKey: "hallway_pov_02" } },
      { fnName: "triggerDreadTimerStart", args: { durationMs: 30_000 } },
      { fnName: "triggerCardDiscovered", args: { cardId: "card2" } },
    ],
    extra: "hallway_pov_02_all", // runs card2_hunt_and_prewarm + hallway_pov_02_acecard
  },
};
