export type PlayerEmotion =
  | "calm"
  | "curious"
  | "tense"
  | "afraid"
  | "bored"
  | "laughing"
  | "overwhelmed"
  | "whispering";

export type ProximityState = "ISOLATED" | "ECHO" | "RANGE" | "FOUND";

export interface PlayerSession {
  sessionId: string;
  /** Float 0.0–1.0. Primary compliance driver for all NPC agents. */
  trustLevel: number;
  /** Float 0.0–1.0. Drives rebellion and panic behavior. */
  fearIndex: number;
  playerEmotion: PlayerEmotion;
  proximityState: ProximityState;
  fourthWallCount: number;
  /** True when trust crosses the unlock threshold (0.6+). */
  privateKnowledgeUnlocked: boolean;
  sceneKey: string;
  /** -1 = unknown (not yet observed), 1 = solo, 2 = pair, 3+ = group */
  audienceSize: number;
  groupDynamic: "unknown" | "solo" | "pair" | "group";
  createdAt: number;
  updatedAt: number;
}

// Events broadcast over WebSocket to the frontend
export type GmEventType =
  | "trust_update"
  | "hud_glitch"
  | "scene_change"
  | "slotsky_trigger"
  | "audience_update"
  | "overlay_text"
  | "npc_idle_nudge"
  | "autoplay_advance";

export type OverlayVariant =
  | "talk_prompt"
  | "idle_soft"
  | "idle_urgent"
  | "card_interact"
  | "glitch_vision_flash";

export type NpcNudgeUrgency = "soft" | "urgent";

export type AutoplayAdvanceReason = "timeout" | "npc_choice";

export interface GmEvent {
  type: GmEventType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface OverlayTextPayload {
  text: string;
  variant: OverlayVariant;
  durationMs: number;
}

export interface NpcIdleNudgePayload {
  phase: string;
  secondsSilent: number;
  urgency: NpcNudgeUrgency;
}

export interface AutoplayAdvancePayload {
  fromStep: number;
  toStep: number;
  reason: AutoplayAdvanceReason;
}
