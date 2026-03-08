export type PlayerEmotion =
  | 'calm'
  | 'curious'
  | 'tense'
  | 'afraid'
  | 'bored'
  | 'laughing'
  | 'overwhelmed'
  | 'whispering';

export type ProximityState = 'ISOLATED' | 'ECHO' | 'RANGE' | 'FOUND';

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
  createdAt: number;
  updatedAt: number;
}

// Events broadcast over WebSocket to the frontend
export type GmEventType = 'trust_update' | 'hud_glitch' | 'scene_change' | 'slotsky_trigger';

export interface GmEvent {
  type: GmEventType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
