import * as admin from 'firebase-admin';
import { PlayerSession, TrustLevel } from '../types/state';

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
    trustLevel: TrustLevel.Neutral,
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

export async function updateTrustLevel(sessionId: string, newLevel: TrustLevel): Promise<void> {
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
