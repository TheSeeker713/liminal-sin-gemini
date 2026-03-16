/**
 * Clip Cues — per-clip timed SFX, Jason dialogue, and glitch events.
 *
 * Pure data + thin scheduling layer. Each pre-rendered clip has an array of
 * time-offset cues derived from LS_VIDEO_PIPELINE.md. When a scene_change
 * fires, `startClipCues()` schedules all cues for that mediaId via setTimeout.
 * `clearClipCues()` cancels active timers on scene change or WS close.
 *
 * Cue types:
 *   - jason_dialogue  → sendText() into Jason's Gemini session
 *   - sfx             → clip_sfx WS event to frontend
 *   - hud_glitch      → hud_glitch WS event to frontend (existing event)
 *
 * No WS state, no session refs, no Gemini refs at module scope.
 * Consumed by gameMaster.ts triggerSceneChange handler.
 */

import { WebSocket } from "ws";
import type { LiveSessionManager } from "./gemini";

type CueType = "jason_dialogue" | "sfx" | "hud_glitch";

type ClipCue = {
  offsetMs: number;
  type: CueType;
  text?: string;
  sfx?: string;
  intensity?: string;
  durationMs?: number;
};

/**
 * Timed cue map — keyed by mediaId (not sceneKey).
 * All offsets and content sourced from LS_VIDEO_PIPELINE.md authoritative spec.
 */
const CLIP_CUES: Record<string, ClipCue[]> = {
  // ── flashlight_sweep_01 | 10s | muted clip ──────────────────────────────────
  flashlight_sweep_01: [
    { offsetMs: 0, type: "sfx", sfx: "walking_start" },
    { offsetMs: 0, type: "sfx", sfx: "ambient_start" },
    { offsetMs: 500, type: "jason_dialogue", text: "[SCENE_CUE: Your flashlight is sweeping the tunnel. You see 'Boring' written on the wall. React naturally — say something like 'the wall says Boring, but this is far from boring'.]" },
  ],

  // ── tunnel_flashlight_01 | 15s | no native sound ────────────────────────────
  tunnel_flashlight_01: [
    { offsetMs: 3000, type: "sfx", sfx: "walking_start" },
    { offsetMs: 7000, type: "jason_dialogue", text: "[SCENE_CUE: You see a white generator ahead in the tunnel. It looks like it moved on its own toward you. React with unease.]" },
    { offsetMs: 12000, type: "sfx", sfx: "walking_stop" },
  ],

  // ── tunnel_generator_01 | 10s | no native sound ─────────────────────────────
  tunnel_generator_01: [
    { offsetMs: 1500, type: "sfx", sfx: "walking_start" },
    { offsetMs: 6000, type: "jason_dialogue", text: "[SCENE_CUE: You notice the name on the tunnel wall has changed from 'Boring' to 'Bard'. That is strange and unsettling. React.]" },
    { offsetMs: 10000, type: "sfx", sfx: "walking_stop" },
  ],

  // ── card_joker_01 | 15s | no native sound ───────────────────────────────────
  card_joker_01: [
    { offsetMs: 5000, type: "jason_dialogue", text: "[SCENE_CUE: You are turning the generator on now. Say something like 'I'm turning it on now'.]" },
    { offsetMs: 8000, type: "jason_dialogue", text: "[SCENE_CUE: The lights are on. The tunnel is lit. React to seeing the tunnel clearly for the first time.]" },
    // 9000ms: flashlight CSS overlay removal — DEFERRED (BE_AUDIT #13)
    { offsetMs: 13000, type: "jason_dialogue", text: "[SCENE_CUE: You look down and see a Joker playing card on the ground near the generator base. React with confusion — a playing card should not be here underground.]" },
  ],

  // ── card_pickup_01 | 6s | no native sound ───────────────────────────────────
  card_pickup_01: [
    { offsetMs: 0, type: "jason_dialogue", text: "[SCENE_CUE: You are picking up the Joker card from the floor. Say something like 'okay, I'm picking it up now'.]" },
    { offsetMs: 0, type: "sfx", sfx: "ambient_start" },
  ],

  // ── tunnel_transition_01 | 15s | HAS native sound ──────────────────────────
  // NOTE: white CSS fade deferred (BE_AUDIT #14)
  tunnel_transition_01: [
    { offsetMs: 0, type: "jason_dialogue", text: "[SCENE_CUE: You are suddenly somewhere else. Still in a tunnel, but you were just by a generator a moment ago. React with confusion.]" },
    { offsetMs: 8000, type: "jason_dialogue", text: "[SCENE_CUE: There is a waterpark to the right of the tunnel. You are confused and surprised — an underground waterpark should not exist. React.]" },
  ],

  // ── park_reveal_01 | 15s | HAS native sound ─────────────────────────────────
  park_reveal_01: [
    { offsetMs: 9000, type: "hud_glitch", intensity: "high", durationMs: 1000 },
    { offsetMs: 13000, type: "jason_dialogue", text: "[SCENE_CUE: You see blue, yellow, orange and green slides to your left. A shallow pool in front of you. Describe what you see with awe and unease.]" },
  ],

  // ── park_walkway_01 | 10s | HAS native sound ────────────────────────────────
  park_walkway_01: [
    { offsetMs: 5000, type: "jason_dialogue", text: "[SCENE_CUE: You notice the hanger-like ceiling above you. It is enormous. React to the scale.]" },
    { offsetMs: 9000, type: "jason_dialogue", text: "[SCENE_CUE: The ceiling above is going dark. The lights are fading in the upper sections. React with growing unease.]" },
  ],

  // ── park_walkway_02 | 15s | no native sound ─────────────────────────────────
  park_walkway_02: [
    { offsetMs: 0, type: "sfx", sfx: "water_fountain" },
    { offsetMs: 0, type: "sfx", sfx: "wet_concrete_walking" },
    { offsetMs: 3000, type: "jason_dialogue", text: "[SCENE_CUE: You notice a manmade cave to the right. You decide to check it out. Tell the player about it.]" },
  ],

  // ── park_liminal_01 | 15s | no native sound ─────────────────────────────────
  park_liminal_01: [
    { offsetMs: 7000, type: "jason_dialogue", text: "[SCENE_CUE: The water park is changing in front of you. Things are shifting. React with unease.]" },
    { offsetMs: 13000, type: "jason_dialogue", text: "[SCENE_CUE: The slides have changed colors. The shallow pool is gone. There is a pool that looks like a lazy river but it is not. You are confused and a little scared. Describe what you see.]" },
  ],

  // ── maintenance_reveal_01 | 15s | no native sound ───────────────────────────
  maintenance_reveal_01: [
    { offsetMs: 9000, type: "jason_dialogue", text: "[SCENE_CUE: The environment is changing again. This time there is a building where there was none before. React to the impossibility.]" },
    { offsetMs: 13000, type: "jason_dialogue", text: "[SCENE_CUE: You notice what looks like a maintenance shaft where the cave was before. You decide to investigate.]" },
  ],

  // ── shaft_maintenance_01 | 10s | no native sound ────────────────────────────
  shaft_maintenance_01: [
    { offsetMs: 5000, type: "jason_dialogue", text: "[SCENE_CUE: A secret entrance opens up. You notice an elevator inside. React with surprise.]" },
    { offsetMs: 9000, type: "jason_dialogue", text: "[SCENE_CUE: You decide to get in the elevator. This is getting really weird. Express how strange this all is.]" },
  ],

  // ── elevator_entry_01 | 15s | no native sound ───────────────────────────────
  elevator_entry_01: [
    { offsetMs: 0, type: "jason_dialogue", text: "[SCENE_CUE: You walk up to the elevator door.]" },
    { offsetMs: 7000, type: "jason_dialogue", text: "[SCENE_CUE: The elevator door is opening. React.]" },
    { offsetMs: 11000, type: "jason_dialogue", text: "[SCENE_CUE: You step inside the elevator.]" },
  ],

  // ── elevator_inside_01 | 5s | no native sound ───────────────────────────────
  elevator_inside_01: [
    { offsetMs: 0, type: "jason_dialogue", text: "[SCENE_CUE: The elevator starts going down immediately. React with surprise.]" },
    { offsetMs: 4000, type: "jason_dialogue", text: "[SCENE_CUE: The elevator door is starting to open. What will be on the other side?]" },
  ],

  // ── elevator_inside_02 | 15s | HAS native sound ─────────────────────────────
  elevator_inside_02: [
    { offsetMs: 4000, type: "hud_glitch", intensity: "high", durationMs: 2000 },
    { offsetMs: 6000, type: "jason_dialogue", text: "[SCENE_CUE: The elevator door opened. You are walking into a hallway.]" },
  ],

  // ── hallway_pov_01 | 10s | HAS native sound ─────────────────────────────────
  hallway_pov_01: [
    { offsetMs: 0, type: "jason_dialogue", text: "[SCENE_CUE: You continue walking down the hallway. Keep moving forward.]" },
  ],

  // ── acecard_reveal_01 | 15s | HAS native sound ──────────────────────────────
  acecard_reveal_01: [
    { offsetMs: 6500, type: "jason_dialogue", text: "[SCENE_CUE: You notice your clothes have changed — you are now wearing a leather jacket. You are freaking out. React with shock and fear.]" },
    { offsetMs: 12000, type: "jason_dialogue", text: "[SCENE_CUE: You see another card on the ground. An Ace card. React to finding it.]" },
  ],

  // card_pickup_02 | 7s | HAS native sound — no specific timed cues per LS_VIDEO_PIPELINE
};

// ---------------------------------------------------------------------------
// Session-scoped timer management
// ---------------------------------------------------------------------------
const activeTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

/** Cancel all active clip cue timers for a session. */
export function clearClipCues(sessionId: string): void {
  const timers = activeTimers.get(sessionId);
  if (timers) {
    for (const t of timers) clearTimeout(t);
    activeTimers.delete(sessionId);
  }
}

/**
 * Schedule all timed cues for a clip. Clears any previously active cues
 * for the session first (handles rapid scene chaining).
 */
export function startClipCues(
  sessionId: string,
  mediaId: string,
  ws: WebSocket,
  jasonManager?: LiveSessionManager,
): void {
  clearClipCues(sessionId);

  const cues = CLIP_CUES[mediaId];
  if (!cues || cues.length === 0) return;

  const timers: ReturnType<typeof setTimeout>[] = [];

  for (const cue of cues) {
    const t = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) return;

      switch (cue.type) {
        case "jason_dialogue":
          if (cue.text && jasonManager) {
            jasonManager.sendText(cue.text);
            console.log(`[ClipCues] Jason dialogue fired — mediaId="${mediaId}" offset=${cue.offsetMs}ms`);
          }
          break;

        case "sfx":
          ws.send(
            JSON.stringify({
              type: "clip_sfx",
              payload: { sfx: cue.sfx, mediaId },
            }),
          );
          console.log(`[ClipCues] SFX "${cue.sfx}" fired — mediaId="${mediaId}" offset=${cue.offsetMs}ms`);
          break;

        case "hud_glitch":
          ws.send(
            JSON.stringify({
              type: "hud_glitch",
              intensity: cue.intensity ?? "medium",
              duration_ms: cue.durationMs ?? 800,
            }),
          );
          console.log(`[ClipCues] Glitch fired — mediaId="${mediaId}" intensity="${cue.intensity}" offset=${cue.offsetMs}ms`);
          break;
      }
    }, cue.offsetMs);
    timers.push(t);
  }

  activeTimers.set(sessionId, timers);
  console.log(`[ClipCues] Scheduled ${cues.length} cues for mediaId="${mediaId}" — session="${sessionId}"`);
}
