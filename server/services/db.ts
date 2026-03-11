import * as admin from 'firebase-admin';
import { PlayerSession } from '../types/state';

let db: admin.firestore.Firestore | null = null;
const memoryStore = new Map<string, PlayerSession>();

try {
  if (!admin.apps.length) {
    // Uses Application Default Credentials (ADC) — set up via `gcloud auth application-default login`
    // No explicit key file needed; ADC auto-discovers credentials from the environment.
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
  }
  db = admin.firestore();
  console.log('[DB] Firestore initialized via ADC (Application Default Credentials).');
} catch (e) {
  console.error('[DB] Failed to initialize Firestore. Falling back to in-memory store:', (e as Error).message);
}

export async function getOrCreateSession(sessionId: string): Promise<PlayerSession> {
  const defaultSession: PlayerSession = {
    sessionId,
    trustLevel: 0.5,
    fearIndex: 0.0,
    playerEmotion: 'calm',
    proximityState: 'ISOLATED',
    fourthWallCount: 0,
    privateKnowledgeUnlocked: false,
    sceneKey: '',
    audienceSize: -1,
    groupDynamic: 'unknown',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (db) {
    const docRef = db.collection('sessions').doc(sessionId);
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data() as PlayerSession;
    } else {
      await docRef.set(defaultSession);
      return defaultSession;
    }
  } else {
    if (memoryStore.has(sessionId)) {
      return memoryStore.get(sessionId)!;
    }
    memoryStore.set(sessionId, defaultSession);
    return defaultSession;
  }
}

export async function updateTrustLevel(sessionId: string, newLevel: number): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      trustLevel: newLevel,
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.trustLevel = newLevel;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export async function updateFearIndex(sessionId: string, newLevel: number): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      fearIndex: newLevel,
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.fearIndex = newLevel;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export async function updateAudienceState(
  sessionId: string,
  audienceSize: number,
  groupDynamic: 'unknown' | 'solo' | 'pair' | 'group'
): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      audienceSize,
      groupDynamic,
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.audienceSize = audienceSize;
      session.groupDynamic = groupDynamic;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export async function updateSceneKey(sessionId: string, sceneKey: string): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      sceneKey,
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.sceneKey = sceneKey;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export async function updateProximityState(
  sessionId: string,
  proximityState: 'ISOLATED' | 'ECHO' | 'RANGE' | 'FOUND'
): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      proximityState,
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.proximityState = proximityState;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export interface ClientErrorLog {
  sessionId: string;
  errorType: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  stack?: string;
  url?: string;
  timestamp: number;
  receivedAt: number;
}

export async function updateFourthWallCount(sessionId: string, increment: number): Promise<void> {
  if (db) {
    await db.collection('sessions').doc(sessionId).update({
      fourthWallCount: admin.firestore.FieldValue.increment(increment),
      updatedAt: Date.now()
    });
  } else {
    const session = memoryStore.get(sessionId);
    if (session) {
      session.fourthWallCount = (session.fourthWallCount ?? 0) + increment;
      session.updatedAt = Date.now();
      memoryStore.set(sessionId, session);
    }
  }
}

export async function logClientError(entry: ClientErrorLog): Promise<void> {
  // Firestore rejects undefined values — strip optional fields that weren't provided.
  const doc: Record<string, unknown> = {
    sessionId: entry.sessionId,
    errorType: entry.errorType,
    message: entry.message,
    severity: entry.severity,
    timestamp: entry.timestamp,
    receivedAt: entry.receivedAt
  };
  if (entry.stack !== undefined) doc.stack = entry.stack;
  if (entry.url !== undefined) doc.url = entry.url;

  if (db) {
    await db.collection('client_error_logs').add(doc);
  } else {
    console.warn('[DB] client_error_logs (in-memory fallback):', doc);
  }
}
