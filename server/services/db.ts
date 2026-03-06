import * as admin from 'firebase-admin';
import { PlayerSession, TrustLevel } from '../types/state';

// Initialize Firebase. Fallback to a mock/in-memory store if credentials are not present
// to unblock local development without needing the actual GCP service account immediately.
let db: admin.firestore.Firestore | null = null;
const memoryStore = new Map<string, PlayerSession>();

try {
  if (!admin.apps.length) {
    // In production, GOOGLE_APPLICATION_CREDENTIALS should be set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
      admin.initializeApp();
      db = admin.firestore();
      console.log('[DB] Firestore initialized via Admin SDK.');
    } else {
      console.warn('[DB] No Firebase credentials found. Falling back to in-memory store for local dev.');
    }
  } else {
    db = admin.firestore();
  }
} catch (e) {
  console.error('[DB] Failed to initialize Firestore:', e);
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
