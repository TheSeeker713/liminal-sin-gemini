import { WebSocket } from 'ws';
import { updateTrustLevel, updateFearIndex, updateAudienceState, updateSceneKey, updateProximityState, updateFourthWallCount, getOrCreateSession } from './db';
import { generateSceneImage, getCachedImage } from './imagen';
import { generateSceneVideo } from './veo';
import { startDreadTimer } from './dreadTimer';
import type { LiveSessionManager } from './gemini';

// Per-session throttle map — prevents rapid-fire hud_glitch broadcasts (e.g. GROUP audience spam).
const lastGlitchMs = new Map<string, number>();
const GLITCH_COOLDOWN_MS = 3000; // minimum 3 seconds between consecutive glitch events per session

/** Call on WebSocket close to reclaim memory for the ended session. */
export function clearGlitchThrottle(sessionId: string): void {
  lastGlitchMs.delete(sessionId);
}

/**
 * Handles a function call dispatched by the Gemini Game Master.
 * Persists the state change to Firestore and broadcasts the event
 * over WebSocket to the connected frontend client.
 * jasonManager, if provided, receives a live trust-context update so Jason's
 * in-flight Gemini session adapts immediately — not just on the next connect.
 */
export async function handleGmFunctionCall(
  sessionId: string,
  functionName: string,
  args: Record<string, unknown>,
  clientWs: WebSocket,
  jasonManager?: LiveSessionManager,
  onAudreyVoice?: (trustLevel: number) => void
): Promise<void> {
  console.log(`[GM] Function call: ${functionName}`, args);

  let wsMessage: Record<string, unknown> | null = null;

  switch (functionName) {
    case 'triggerTrustChange': {
      // Accept both the PascalCase string enum Gemini sends (High/Neutral/Low)
      // AND a raw numeric float (e.g. from the debug endpoint or direct calls).
      const levelMap: Record<string, number> = { high: 0.8, neutral: 0.5, low: 0.2 };
      const raw = args.newTrustLevel;
      const newLevel = typeof raw === 'number'
        ? Math.max(0, Math.min(1, raw))
        : (levelMap[(raw as string)?.toLowerCase()] ?? 0.5);
      await updateTrustLevel(sessionId, newLevel);
      const session = await getOrCreateSession(sessionId);
      wsMessage = {
        type: 'trust_update',
        agent: 'gm',
        trust_level: newLevel,
        fear_index: session.fearIndex
      };
      // Push live trust context into Jason's running Gemini session so his
      // behaviour adapts immediately without waiting for a reconnect.
      if (jasonManager) {
        jasonManager.sendText(
          `[TRUST_SYSTEM: trust_level is now ${newLevel.toFixed(2)} — ` +
          `reason: ${args.reason ?? 'unspecified'}. Adjust your behaviour accordingly.]`
        );
        console.log(`[GM] Injected trust context into Jason — level: ${newLevel.toFixed(2)}`);
      }
      break;
    }

    case 'triggerFearChange': {
      const newFearLevel = Math.max(0, Math.min(1, args.newFearLevel as number));
      await updateFearIndex(sessionId, newFearLevel);
      const fearSession = await getOrCreateSession(sessionId);
      wsMessage = {
        type: 'trust_update',
        agent: 'gm',
        trust_level: fearSession.trustLevel,
        fear_index: newFearLevel
      };
      if (jasonManager) {
        jasonManager.sendText(
          `[TRUST_SYSTEM: fear_index is now ${newFearLevel.toFixed(2)} — ` +
          `reason: ${args.reason ?? 'unspecified'}. Adjust your fear behaviour accordingly.]`
        );
        console.log(`[GM] Injected fear context into Jason — level: ${newFearLevel.toFixed(2)}`);
      }
      break;
    }

    case 'triggerGlitchEvent': {
      const now = Date.now();
      const last = lastGlitchMs.get(sessionId) ?? 0;
      if (now - last < GLITCH_COOLDOWN_MS) {
        console.log(`[GM] triggerGlitchEvent throttled — cooldown active for session "${sessionId}"`);
        break;
      }
      lastGlitchMs.set(sessionId, now);
      const durationMap: Record<string, number> = { low: 500, medium: 800, high: 1200 };
      const intensity = args.intensity as string;
      wsMessage = {
        type: 'hud_glitch',
        intensity,
        duration_ms: durationMap[intensity] ?? 800
      };
      break;
    }

    case 'triggerSceneChange': {
      const sceneKey = args.sceneKey as string;
      await updateSceneKey(sessionId, sceneKey);
      wsMessage = {
        type: 'scene_change',
        payload: { sceneKey }
      };
      // Try the pre-warm cache first; fall back to live Imagen 4 generation.
      const cachedBase64 = getCachedImage(sessionId, sceneKey);
      if (cachedBase64) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'scene_image',
            agent: 'gm',
            sessionId,
            payload: { sceneKey, data: cachedBase64 },
            timestamp: Date.now()
          }));
          console.log(`[GM] Broadcast scene_image (cache hit) — sceneKey="${sceneKey}"`);
        }
      } else {
        // Cache miss — generate on demand (non-blocking)
        void generateSceneImage(sceneKey).then((base64) => {
          if (base64 && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'scene_image',
              agent: 'gm',
              sessionId,
              payload: { sceneKey, data: base64 },
              timestamp: Date.now()
            }));
            console.log(`[GM] Broadcast scene_image (generated) — sceneKey="${sceneKey}"`);
          }
        });
      }
      break;
    }

    case 'triggerSlotsky': {
      const anomalyType = args.anomalyType as string;
      if (anomalyType === 'found_transition') {
        await updateProximityState(sessionId, 'FOUND');
      }
      if (anomalyType === 'fourth_wall_correction') {
        await updateFourthWallCount(sessionId, 1);
      }
      wsMessage = {
        type: 'slotsky_trigger',
        payload: { anomalyType }
      };
      break;
    }

    case 'triggerVideoGen': {
      const veoSceneKey = args.sceneKey as string;
      wsMessage = {
        type: 'video_gen_started',
        payload: { sceneKey: veoSceneKey }
      };
      // Fire Veo 3.1 Fast async — uses the last Imagen 4 still for this session.
      // The still image must already have been generated by triggerSceneChange.
      // We re-generate the image bytes here (cached by Imagen if called recently)
      // to pass as the reference frame for Veo.
      void (async () => {
        try {
          const base64Jpeg = await generateSceneImage(veoSceneKey);
          if (!base64Jpeg) {
            console.warn(`[GM] No image available for Veo — sceneKey="${veoSceneKey}". Skipping video gen.`);
            return;
          }
          const videoUri = await generateSceneVideo(veoSceneKey, base64Jpeg);
          if (videoUri && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'scene_video',
              agent: 'gm',
              sessionId,
              payload: { sceneKey: veoSceneKey, url: videoUri },
              timestamp: Date.now()
            }));
            console.log(`[GM] Broadcast scene_video — sceneKey="${veoSceneKey}"`);
          }
        } catch (err) {
          console.error(`[GM] Veo pipeline failed for sceneKey="${veoSceneKey}":`, (err as Error).message);
        }
      })();
      break;
    }

    case 'triggerAudienceUpdate': {
      const personCount = args.personCount as number;
      const dynamic = args.groupDynamic as 'unknown' | 'solo' | 'pair' | 'group';
      const observedEmotions = (args.observedEmotions as string) ?? 'not specified';
      await updateAudienceState(sessionId, personCount, dynamic);
      wsMessage = {
        type: 'audience_update',
        agent: 'gm',
        payload: { personCount, groupDynamic: dynamic, observedEmotions }
      };
      // Inject audience context into Jason so he can react naturally without breaking character.
      if (jasonManager) {
        const dynamicLabel = dynamic === 'solo'
          ? 'one person — they are alone'
          : dynamic === 'pair'
            ? 'two people — they came together'
            : dynamic === 'group'
              ? `a group (${personCount} people) — social dynamics in play`
              : 'an unknown number of people';
        jasonManager.sendText(
          `[SITUATION_UPDATE: You just noticed something — ${dynamicLabel} on the other end of the voicebox. ` +
          `Observed emotional state: ${observedEmotions}. ` +
          `React in-character, naturally, as if you just caught a detail through the voicebox — ` +
          `an extra shuffle, a second breath, more than one voice. ` +
          `Do NOT say "GM told me" or "detected". React as if you just noticed it yourself.]`
        );
        console.log(`[GM] Injected audience context into Jason — dynamic: ${dynamic}, count: ${personCount}`);
      }
      break;
    }

    case 'triggerAudreyVoice': {
      const audreyTrust = typeof args.trustLevel === 'number'
        ? Math.max(0, Math.min(1, args.trustLevel))
        : 0.5;
      if (onAudreyVoice) {
        onAudreyVoice(audreyTrust);
        console.log(`[GM] triggerAudreyVoice fired — trust=${audreyTrust.toFixed(2)} session="${sessionId}"`);
      } else {
        console.warn(`[GM] triggerAudreyVoice ignored — no callback registered for session="${sessionId}"`);
      }
      // Broadcast scene_change so frontend can apply the audrey_echo visual treatment.
      wsMessage = {
        type: 'scene_change',
        payload: { sceneKey: 'audrey_echo' }
      };
      break;
    }

    case 'triggerCardDiscovered': {
      const cardId = args.cardId as string;
      wsMessage = {
        type: 'card_discovered',
        cardId
      };
      console.log(`[GM] triggerCardDiscovered fired — cardId="${cardId}" session="${sessionId}"`);
      break;
    }

    case 'triggerDreadTimerStart': {
      const durationMs = args.durationMs as number;
      wsMessage = {
        type: 'dread_timer_start',
        durationMs
      };
      // Start the backend timer — will emit game_over if it expires
      startDreadTimer(sessionId, durationMs, clientWs);
      console.log(`[GM] triggerDreadTimerStart fired — durationMs=${durationMs} session="${sessionId}"`);
      break;
    }

    default:
      console.warn(`[GM] Unknown function call received: ${functionName}`);
      return;
  }

  if (wsMessage && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify(wsMessage));
    console.log(`[GM] Broadcast event to client: ${wsMessage.type}`);
  }
}
