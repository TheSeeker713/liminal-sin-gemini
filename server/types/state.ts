export enum TrustLevel {
  Neutral = 'Neutral',
  High = 'High',
  Low = 'Low'
}

export type PlayerEmotion =
  | 'calm'
  | 'curious'
  | 'tense'
  | 'afraid'
  | 'bored'
  | 'laughing'
  | 'overwhelmed'
  | 'whispering';

export interface PlayerSession {
  sessionId: string;
  trustLevel: TrustLevel;
  playerEmotion: PlayerEmotion;
  fourthWallCount: number;
  sceneKey: string;
  createdAt: number;
  updatedAt: number;
}

// Events broadcast over WebSocket to the frontend
export type GmEventType = 'TRUST_CHANGE' | 'GLITCH_EVENT' | 'SCENE_CHANGE' | 'SLOTSKY_TRIGGER';

export interface GmEvent {
  type: GmEventType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
