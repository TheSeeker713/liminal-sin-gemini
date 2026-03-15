import { WebSocket } from "ws";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import {
  updateTrustLevel,
  updateFearIndex,
  updateAudienceState,
  updateSceneKey,
  updateProximityState,
  updateFourthWallCount,
  getOrCreateSession,
} from "./db";
import { generateSceneImage, getCachedImage } from "./imagen";
import { generateSceneVideo } from "./veo";
import { startDreadTimerWithCallback } from "./dreadTimer";
import type { LiveSessionManager } from "./gemini";
import { SCENE_VISUAL_CONTEXT, SCENE_FRAME_TIMESTAMPS } from "./keywordLibrary";

// Per-session throttle map — prevents rapid-fire hud_glitch broadcasts (e.g. GROUP audience spam).
const lastGlitchMs = new Map<string, number>();
const GLITCH_COOLDOWN_MS = 3000; // minimum 3 seconds between consecutive glitch events per session

/**
 * Morphic clip IDs — pre-built GCS media the frontend loads directly.
 * scene_image for these is unnecessary for the client (causes React batching
 * race that hides the playing video). Jason still receives the frame directly.
 */
const MORPHIC_CLIP_IDS = new Set([
  "tunnel_darkness_01",
  "tunnel_flashlight_01",
  "tunnel_generator_01",
  "card_joker_01",
  "card_pickup_01",
  "card_pickup_02",
  "tunnel_transition_01",
  "park_reveal_01",
  "park_walkway_01",
  "park_walkway_02",
  "park_liminal_01",
  "shaft_maintenance_01",
  "maintenance_reveal_01",
  "elevator_entry_01",
  "elevator_inside_01",
  "elevator_inside_02",
  "hallway_pov_01",
  "hallway_pov_02",
  "acecard_reveal_01",
]);

type TriggerType = "chained_auto" | "hold_for_input";
type AudioMode = "native_audio" | "muted" | "silent_source";

function resolveMediaId(sceneKey: string): string {
  switch (sceneKey) {
    case "flashlight_beam":
      return "tunnel_flashlight_01";
    case "generator_area_start":
      return "tunnel_generator_01";
    case "generator_area_operational":
      return "tunnel_generator_01";
    case "generator_card_reveal":
      return "card_joker_01";
    case "card1_pickup_pov":
      return "card_pickup_01";
    case "tunnel_to_park_transition":
      return "tunnel_transition_01";
    case "park_transition_reveal":
      return "park_reveal_01";
    case "park_entrance":
      return "park_walkway_01";
    case "park_walkway":
      return "park_walkway_02";
    case "park_shaft_view":
      return "shaft_maintenance_01";
    case "maintenance_entry":
      return "elevator_entry_01";
    case "maintenance_panel":
      return "hallway_pov_01"; // Beat 7 maintenance panel = hallway_pov_01 Morphic file
    case "card2_pickup_pov":
      return "card_pickup_02";
    case "wildcard_vision_feed":
      return "hallway_pov_01";
    case "wildcard_game_over":
      return "maintenance_reveal_01";
    case "wildcard_good_ending":
      return "wildcard_good_ending";
    case "tunnel_darkness_01":
      return "tunnel_darkness_01";
    case "park_liminal":
      return "park_liminal_01";
    case "elevator_inside":
      return "elevator_inside_01";
    case "elevator_inside_2":
      return "elevator_inside_02";
    case "hallway_pov_02":
      return "hallway_pov_02";
    case "acecard_reveal":
      return "acecard_reveal_01";
    default:
      return sceneKey;
  }
}

function resolveTriggerType(mediaId: string): TriggerType {
  // STILL hold steps only — all chained_auto clips are NOT in this set.
  // Keep in sync with STEP_MEDIA_TRIGGER in stepMachine.ts.
  const holdIds = new Set([
    "tunnel_generator_01",   // step 11 — generator_area_operational STILL
    "card_joker_01",         // step 13 — joker card STILL
    "tunnel_transition_01",  // step 17 — tunnel-to-park STILL
    "park_liminal_01",       // step 24 — liminal park STILL
    "elevator_entry_01",     // step 27 — elevator entry STILL
    "hallway_pov_02",        // step 31 — hallway STILL + game_over timer
    "card_pickup_02",        // acecard flow — card2 STILL
  ]);
  return holdIds.has(mediaId) ? "hold_for_input" : "chained_auto";
}

function resolveTimeoutSeconds(mediaId: string): number {
  if (mediaId === "card_pickup_02") {
    return 15; // urgent 15s window for card2 acecard flow
  }
  return 30; // default for all STILL holds and chained clips
}

function resolveAudioMode(mediaId: string): AudioMode {
  if (mediaId === "tunnel_darkness_01") {
    return "muted";
  }
  return "native_audio";
}

async function downloadVideoToTempFile(videoUrl: string): Promise<string> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download video: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const filePath = join(tmpdir(), `ls-video-${randomUUID()}.mp4`);
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return filePath;
}

async function extractFrameAtSecond(
  videoPath: string,
  seconds: number,
): Promise<string> {
  const outPath = join(tmpdir(), `ls-frame-${randomUUID()}.jpg`);

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-ss",
        seconds.toFixed(2),
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        outPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`ffmpeg execution failed: ${err.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited with code ${code}. ${stderr.trim()}`));
    });
  });

  try {
    const frameBuffer = await fs.readFile(outPath);
    return frameBuffer.toString("base64");
  } finally {
    await fs.rm(outPath, { force: true });
  }
}

async function feedVideoFramesToJason(
  videoUrl: string,
  sceneKey: string,
  jasonManager: LiveSessionManager,
): Promise<void> {
  const videoPath = await downloadVideoToTempFile(videoUrl);
  try {
    // Use per-video timestamps from keywordLibrary, fall back to defaults
    const mediaId = resolveMediaId(sceneKey);
    const defaultTs = sceneKey.includes("wildcard")
      ? [1.0, 4.0, 7.0]
      : [1.0, 3.0, 5.0];
    const timestamps = SCENE_FRAME_TIMESTAMPS[mediaId] ?? defaultTs;
    for (const ts of timestamps) {
      const frame = await extractFrameAtSecond(videoPath, ts);
      jasonManager.sendFrame(frame);
    }

    // Use per-scene visual context from keywordLibrary, fall back to generic
    const context = SCENE_VISUAL_CONTEXT[sceneKey];
    if (context) {
      jasonManager.sendText(context);
    } else {
      jasonManager.sendText(
        `[VISUAL_CONTEXT: You just watched moving footage through your smartglasses from scene ${sceneKey}. If anything impossible moved on its own, react immediately in character with one sharp spoken line.]`,
      );
    }
  } finally {
    await fs.rm(videoPath, { force: true });
  }
}

/** Call on WebSocket close to reclaim memory for the ended session. */
export function clearGlitchThrottle(sessionId: string): void {
  lastGlitchMs.delete(sessionId);
}

/**
 * Injects scene-specific visual context into Jason when a new scene fires.
 * Called by server.ts after step progression (keyword or timer).
 */
export function injectSceneContextIntoJason(
  sceneKey: string,
  jasonManager: LiveSessionManager,
): void {
  const context = SCENE_VISUAL_CONTEXT[sceneKey];
  if (context) {
    jasonManager.sendText(context);
    console.log(`[GM] Injected scene context into Jason — sceneKey="${sceneKey}"`);
  }
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
  onAudreyVoice?: (trustLevel: number) => void,
  onDreadTimerExpire?: (
    sessionId: string,
    clientWs: WebSocket,
  ) => Promise<void> | void,
  onAcecardReveal?: () => void,
): Promise<void> {
  console.log(`[GM] Function call: ${functionName}`, args);

  let wsMessage: Record<string, unknown> | null = null;

  switch (functionName) {
    case "triggerTrustChange": {
      // Accept both the PascalCase string enum Gemini sends (High/Neutral/Low)
      // AND a raw numeric float (e.g. from the debug endpoint or direct calls).
      const levelMap: Record<string, number> = {
        high: 0.8,
        neutral: 0.5,
        low: 0.2,
      };
      const raw = args.newTrustLevel;
      const newLevel =
        typeof raw === "number"
          ? Math.max(0, Math.min(1, raw))
          : (levelMap[(raw as string)?.toLowerCase()] ?? 0.5);
      await updateTrustLevel(sessionId, newLevel);
      const session = await getOrCreateSession(sessionId);
      wsMessage = {
        type: "trust_update",
        agent: "gm",
        trust_level: newLevel,
        fear_index: session.fearIndex,
      };
      // Push live trust context into Jason's running Gemini session so his
      // behaviour adapts immediately without waiting for a reconnect.
      if (jasonManager) {
        jasonManager.sendText(
          `[TRUST_SYSTEM: trust_level is now ${newLevel.toFixed(2)} — ` +
            `reason: ${args.reason ?? "unspecified"}. Adjust your behaviour accordingly.]`,
        );
        console.log(
          `[GM] Injected trust context into Jason — level: ${newLevel.toFixed(2)}`,
        );
      }
      break;
    }

    case "triggerFearChange": {
      const newFearLevel = Math.max(
        0,
        Math.min(1, args.newFearLevel as number),
      );
      await updateFearIndex(sessionId, newFearLevel);
      const fearSession = await getOrCreateSession(sessionId);
      wsMessage = {
        type: "trust_update",
        agent: "gm",
        trust_level: fearSession.trustLevel,
        fear_index: newFearLevel,
      };
      if (jasonManager) {
        jasonManager.sendText(
          `[TRUST_SYSTEM: fear_index is now ${newFearLevel.toFixed(2)} — ` +
            `reason: ${args.reason ?? "unspecified"}. Adjust your fear behaviour accordingly.]`,
        );
        console.log(
          `[GM] Injected fear context into Jason — level: ${newFearLevel.toFixed(2)}`,
        );
      }
      break;
    }

    case "triggerGlitchEvent": {
      const now = Date.now();
      const last = lastGlitchMs.get(sessionId) ?? 0;
      if (now - last < GLITCH_COOLDOWN_MS) {
        console.log(
          `[GM] triggerGlitchEvent throttled — cooldown active for session "${sessionId}"`,
        );
        break;
      }
      lastGlitchMs.set(sessionId, now);
      const durationMap: Record<string, number> = {
        low: 500,
        medium: 800,
        high: 1200,
      };
      const intensity = args.intensity as string;
      wsMessage = {
        type: "hud_glitch",
        intensity,
        duration_ms: durationMap[intensity] ?? 800,
      };
      break;
    }

    case "triggerSceneChange": {
      const sceneKey = args.sceneKey as string;
      const mediaId = resolveMediaId(sceneKey);
      const triggerType = resolveTriggerType(mediaId);
      const timeoutSeconds = resolveTimeoutSeconds(mediaId);
      await updateSceneKey(sessionId, sceneKey);
      wsMessage = {
        type: "scene_change",
        payload: { sceneKey, mediaId, triggerType, timeoutSeconds },
      };
      // For Morphic clips the frontend loads directly from GCS — skip scene_image
      // to the client (prevents React batching race that hides the playing video).
      // Jason still receives the frame directly for visual context.
      if (MORPHIC_CLIP_IDS.has(mediaId)) {
        const cachedBase64 = getCachedImage(sessionId, sceneKey);
        if (cachedBase64 && jasonManager) {
          jasonManager.sendFrame(cachedBase64);
        } else if (!cachedBase64) {
          void generateSceneImage(sceneKey).then((base64) => {
            if (base64 && jasonManager) {
              jasonManager.sendFrame(base64);
            }
          });
        }
      } else {
        // Wildcard / non-Morphic — send scene_image to client for display
        const cachedBase64 = getCachedImage(sessionId, sceneKey);
        if (cachedBase64) {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "scene_image",
                agent: "gm",
                sessionId,
                payload: {
                  sceneKey,
                  mediaId,
                  triggerType,
                  timeoutSeconds,
                  data: cachedBase64,
                },
                timestamp: Date.now(),
              }),
            );
            console.log(
              `[GM] Broadcast scene_image (cache hit) — sceneKey="${sceneKey}"`,
            );
          }
          if (jasonManager) {
            jasonManager.sendFrame(cachedBase64);
          }
        } else {
          void generateSceneImage(sceneKey).then((base64) => {
            if (base64 && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "scene_image",
                  agent: "gm",
                  sessionId,
                  payload: {
                    sceneKey,
                    mediaId,
                    triggerType,
                    timeoutSeconds,
                    data: base64,
                  },
                  timestamp: Date.now(),
                }),
              );
              console.log(
                `[GM] Broadcast scene_image (generated) — sceneKey="${sceneKey}"`,
              );
            }
            if (base64 && jasonManager) {
              jasonManager.sendFrame(base64);
            }
          });
        }
      }
      break;
    }

    case "triggerSlotsky": {
      const anomalyType = args.anomalyType as string;
      if (anomalyType === "found_transition") {
        await updateProximityState(sessionId, "FOUND");
      }
      if (anomalyType === "fourth_wall_correction") {
        await updateFourthWallCount(sessionId, 1);
      }
      wsMessage = {
        type: "slotsky_trigger",
        payload: { anomalyType },
      };
      break;
    }

    case "triggerVideoGen": {
      const veoSceneKey = args.sceneKey as string;
      const mediaId = resolveMediaId(veoSceneKey);
      const triggerType = resolveTriggerType(mediaId);
      const timeoutSeconds = resolveTimeoutSeconds(mediaId);
      const audioMode = resolveAudioMode(mediaId);
      wsMessage = {
        type: "video_gen_started",
        payload: {
          sceneKey: veoSceneKey,
          mediaId,
          triggerType,
          timeoutSeconds,
          audioMode,
        },
      };
      // Fire Veo 3.1 Fast async — uses the last Imagen 4 still for this session.
      // The still image must already have been generated by triggerSceneChange.
      // We re-generate the image bytes here (cached by Imagen if called recently)
      // to pass as the reference frame for Veo.
      void (async () => {
        try {
          const base64Jpeg = await generateSceneImage(veoSceneKey);
          if (!base64Jpeg) {
            console.warn(
              `[GM] No image available for Veo — sceneKey="${veoSceneKey}". Skipping video gen.`,
            );
            return;
          }
          if (jasonManager) {
            // Give Jason the pre-video still so his visual state matches the clip start.
            jasonManager.sendFrame(base64Jpeg);
          }
          const videoUri = await generateSceneVideo(veoSceneKey, base64Jpeg);
          if (videoUri && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "scene_video",
                agent: "gm",
                sessionId,
                payload: {
                  sceneKey: veoSceneKey,
                  mediaId,
                  triggerType,
                  timeoutSeconds,
                  audioMode,
                  url: videoUri,
                },
                timestamp: Date.now(),
              }),
            );
            console.log(
              `[GM] Broadcast scene_video — sceneKey="${veoSceneKey}"`,
            );
            if (jasonManager) {
              void feedVideoFramesToJason(
                videoUri,
                veoSceneKey,
                jasonManager,
              ).catch((err: Error) => {
                console.warn(
                  `[GM] Jason visual video feed failed for sceneKey="${veoSceneKey}": ${err.message}`,
                );
              });
            }
          }
        } catch (err) {
          console.error(
            `[GM] Veo pipeline failed for sceneKey="${veoSceneKey}":`,
            (err as Error).message,
          );
        }
      })();
      break;
    }

    case "triggerAudienceUpdate": {
      const personCount = args.personCount as number;
      const dynamic = args.groupDynamic as
        | "unknown"
        | "solo"
        | "pair"
        | "group";
      const observedEmotions =
        (args.observedEmotions as string) ?? "not specified";
      await updateAudienceState(sessionId, personCount, dynamic);
      wsMessage = {
        type: "audience_update",
        agent: "gm",
        payload: { personCount, groupDynamic: dynamic, observedEmotions },
      };
      // Inject audience context into Jason so he can react naturally without breaking character.
      if (jasonManager) {
        const dynamicLabel =
          dynamic === "solo"
            ? "one person — they are alone"
            : dynamic === "pair"
              ? "two people — they came together"
              : dynamic === "group"
                ? `a group (${personCount} people) — social dynamics in play`
                : "an unknown number of people";
        jasonManager.sendText(
          `[SITUATION_UPDATE: You just noticed something - ${dynamicLabel} on the other end of the smartglasses audio channel. ` +
            `Observed emotional state: ${observedEmotions}. ` +
            `React in-character, naturally, as if you just caught a detail through the channel - ` +
            `an extra shuffle, a second breath, more than one voice. ` +
            `Do NOT say "GM told me" or "detected". React as if you just noticed it yourself.]`,
        );
        console.log(
          `[GM] Injected audience context into Jason — dynamic: ${dynamic}, count: ${personCount}`,
        );
      }
      break;
    }

    case "triggerAudreyVoice": {
      const audreyTrust =
        typeof args.trustLevel === "number"
          ? Math.max(0, Math.min(1, args.trustLevel))
          : 0.5;
      if (onAudreyVoice) {
        onAudreyVoice(audreyTrust);
        console.log(
          `[GM] triggerAudreyVoice fired — trust=${audreyTrust.toFixed(2)} session="${sessionId}"`,
        );
      } else {
        console.warn(
          `[GM] triggerAudreyVoice ignored — no callback registered for session="${sessionId}"`,
        );
      }
      // Broadcast scene_change so frontend can apply the audrey_echo visual treatment.
      wsMessage = {
        type: "scene_change",
        payload: { sceneKey: "audrey_echo" },
      };
      break;
    }

    case "triggerCardDiscovered": {
      const cardId = args.cardId as string;
      wsMessage = {
        type: "card_discovered",
        cardId,
      };
      console.log(
        `[GM] triggerCardDiscovered fired — cardId="${cardId}" session="${sessionId}"`,
      );
      break;
    }

    case "triggerDreadTimerStart": {
      const durationMs = args.durationMs as number;
      wsMessage = {
        type: "dread_timer_start",
        durationMs,
      };
      // Start the backend timer and route expiration through server-level branch logic.
      startDreadTimerWithCallback(
        sessionId,
        durationMs,
        clientWs,
        onDreadTimerExpire ??
          ((sid, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "game_over" }));
            }
          }),
      );
      console.log(
        `[GM] triggerDreadTimerStart fired — durationMs=${durationMs} session="${sessionId}"`,
      );
      break;
    }

    case "triggerAcecardReveal": {
      // Signal the server to start the acecard reveal flow (clears keyword timer, sends acecard_reveal_start).
      onAcecardReveal?.();
      console.log(
        `[GM] triggerAcecardReveal fired — session="${sessionId}"`,
      );
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
