export enum TrustLevel {
  Neutral = 'Neutral',
  High = 'High',
  Low = 'Low'
}

export interface PlayerSession {
  sessionId: string;
  trustLevel: TrustLevel;
  createdAt: number;
  updatedAt: number;
}
