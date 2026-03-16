import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

import { getOrCreateSession, logClientError } from "./services/db";
import {
  getGameMasterSystemPrompt,
  LiveSessionManager,
} from "./services/gemini";
import { getJasonSystemPrompt } from "./services/npc/jason";
import { getAudreySystemPrompt } from "./services/npc/audrey";
import {
  handleGmFunctionCall,
  clearGlitchThrottle,
  injectSceneContextIntoJason,
} from "./services/gameMaster";
import {
  clearImageCache,
  generateEditedSceneImage,
  generateSceneImage,
} from "./services/imagen";
import { generateSceneVideo } from "./services/veo";
import { handleCardCollected } from "./services/sessionEndings";
import {
  STEP_MEDIA_TRIGGER,
  getStepTimeoutSeconds,
  getNextAutoplayStep,
  STEP_AUTOPLAY_ACTIONS,
} from "./services/stepMachine";
import {
  createAcecardGateState,
  startAcecardKeywordTimer,
  handleAcecardReveal,
  startCardPickup02Timer,
  clearAcecardTimers,
} from "./services/acecardGate";
import { clearClipCues } from "./services/clipCues";
import { KeywordListener } from "./services/keywordListener";
import {
  CARD_PICKUP_KEYWORDS,
  getKeywordListForStep,
} from "./services/keywordLibrary";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "20mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "liminal-sin-mock-ws" });
});

/**
 * POST /debug/fire-gm-event
 * Step K battle-test helper - manually fires any GM function call against an
 * active session without needing Gemini to generate it. Only available when
 * NODE_ENV !== 'production' OR when DEBUG_GM_ENDPOINT=true is set.
 *
 * Body: { sessionId: string, functionName: string, args: object }
 * Example:
 *   { "sessionId": "...", "functionName": "triggerGlitchEvent", "args": { "intensity": "high", "type": "both" } }
 */
const debugSessions = new Map<
  string,
  { ws: WebSocket; jasonManager: LiveSessionManager }
>();

app.post("/debug/fire-gm-event", async (req, res) => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEBUG_GM_ENDPOINT !== "true"
  ) {
    res.status(403).json({
      error:
        "Debug endpoint disabled in production. Set DEBUG_GM_ENDPOINT=true to enable.",
    });
    return;
  }
  const { sessionId, functionName, args } = req.body as {
    sessionId?: string;
    functionName?: string;
    args?: Record<string, unknown>;
  };
  if (!sessionId || !functionName) {
    res.status(400).json({ error: "sessionId and functionName are required" });
    return;
  }
  const entry = debugSessions.get(sessionId);
  if (!entry) {
    res.status(404).json({
      error: `No active session found for sessionId: ${sessionId}. Available: [${[...debugSessions.keys()].join(", ")}]`,
    });
    return;
  }
  try {
    await handleGmFunctionCall(
      sessionId,
      functionName,
      args ?? {},
      entry.ws,
      entry.jasonManager,
    );
    res.json({ ok: true, fired: functionName, args: args ?? {} });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /debug/test-wildcard-vision
 * Pipeline smoke-test: accepts a base64 JPEG in the request body, runs the exact
 * same wildcard_vision_feed pipeline the server executes on a live player_frame
 * (generateEditedSceneImage → generateSceneVideo), and returns all results plus
 * any error detail so caller can distinguish server-side issues from RAI blocks.
 * Gated behind DEBUG_GM_ENDPOINT=true.
 */
app.post("/debug/test-wildcard-vision", async (req, res) => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEBUG_GM_ENDPOINT !== "true"
  ) {
    res
      .status(403)
      .json({ error: "Debug endpoint disabled. Set DEBUG_GM_ENDPOINT=true." });
    return;
  }
  const { jpeg } = req.body as { jpeg?: string };
  if (!jpeg) {
    res
      .status(400)
      .json({ error: "Body must contain { jpeg: '<base64 string>' }" });
    return;
  }

  const t0 = Date.now();
  let editedImageBytes: string | null = null;
  let editDurationMs = 0;
  let videoUri: string | null = null;
  let videoDurationMs = 0;
  let editError: string | null = null;
  let videoError: string | null = null;

  // Step 1 — Imagen edit
  try {
    const t1 = Date.now();
    const edited = await generateEditedSceneImage("wildcard_vision_feed", jpeg);
    editDurationMs = Date.now() - t1;
    if (edited) {
      editedImageBytes = edited.imageBytes;
    } else {
      editError =
        "generateEditedSceneImage returned null (possible RAI block — check server logs)";
    }
  } catch (err) {
    editError = String(err);
  }

  // Step 2 — Veo (only if edit succeeded)
  if (editedImageBytes) {
    try {
      const t2 = Date.now();
      videoUri = await generateSceneVideo(
        "wildcard_vision_feed",
        editedImageBytes,
      );
      videoDurationMs = Date.now() - t2;
      if (!videoUri) {
        videoError =
          "generateSceneVideo returned null (possible RAI block — check server logs)";
      }
    } catch (err) {
      videoError = String(err);
    }
  }

  res.json({
    ok: !editError && !videoError,
    totalDurationMs: Date.now() - t0,
    steps: {
      imagenEdit: {
        success: !!editedImageBytes,
        durationMs: editDurationMs,
        imageBytes: editedImageBytes, // base64 JPEG
        error: editError,
      },
      veoVideo: {
        success: !!videoUri,
        durationMs: videoDurationMs,
        videoUri, // data URI or GCS URI
        error: videoError,
      },
    },
  });
});

/**
 * POST /log-client-error
 * Frontend error reporting endpoint. Writes one doc to Firestore client_error_logs.
 * No auth - errors only, no secrets. AbortSignal.timeout(3000) on the frontend side.
 */
app.post("/log-client-error", async (req, res) => {
  const { sessionId, errorType, message, severity, stack, url, timestamp } =
    req.body as {
      sessionId?: string;
      errorType?: string;
      message?: string;
      severity?: "info" | "warning" | "error" | "fatal";
      stack?: string;
      url?: string;
      timestamp?: number;
    };
  if (!sessionId || !errorType || !message || !severity) {
    res.status(400).json({
      error: "sessionId, errorType, message, and severity are required",
    });
    return;
  }
  try {
    await logClientError({
      sessionId,
      errorType,
      message,
      severity,
      stack,
      url,
      timestamp: timestamp ?? Date.now(),
      receivedAt: Date.now(),
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

wss.on("connection", (ws: WebSocket) => {
  const sessionId = randomUUID();

  // ── Keep-alive ping: prevent Cloud Run idle timeout from killing the WS ──
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 20_000);

  const gmLiveModel = process.env.GM_LIVE_MODEL || "gemini-live-2.5-flash";
  const jasonManager = new LiveSessionManager(); // NPC - speaks, audio out, Enceladus voice
  const gmManager = new LiveSessionManager(gmLiveModel); // GM - silent, function calls only
  const audreyManager = new LiveSessionManager(); // NPC - single echo, Aoede voice
  const keywordListener = new KeywordListener(gmLiveModel); // Keyword detector - listens for per-step keywords
  let jasonIntroFired = false; // Gates Jason's first line until frontend sends intro_complete
  let gmGated = false; // Gates GM scene/video calls until intro_complete is received
  let jasonReadyForPlayer = false; // Gates player audio to Jason until landing monologue completes
  let jasonReadyTimer: ReturnType<typeof setTimeout> | null = null; // Flips jasonReadyForPlayer after ~18s
  let sceneChangeCount = 0; // Tracks GM-triggered scene changes (used by hint timer)
  let hintTimer: ReturnType<typeof setTimeout> | null = null; // B11: flashlight hint fallback
  let npcIdleNudgeTimer: ReturnType<typeof setInterval> | null = null; // 9s silence nudge loop
  let stepWallClockTimer: ReturnType<typeof setTimeout> | null = null; // per-step wall-clock auto-advance (NOT silence-based)
  let lastPlayerSpeechAt = Date.now(); // Used ONLY for idle nudge — NOT for step advancement
  let stepAdvancing = false; // Mutex — prevents double-fire from keyword + timer race
  let currentSequenceStep = 7; // Phase 4 interaction-open baseline step
  let card1Collected = false;
  let card1AutoPickTimer: ReturnType<typeof setTimeout> | null = null;
  let card2AutoPickTimer: ReturnType<typeof setTimeout> | null = null;
  const acecardGateState = createAcecardGateState();
  let lastInjectedSceneKey: string | null = null; // Dedup scene context injection
  let lastInjectedSceneAt = 0;
  let latestPlayerFrame: string | null = null;
  let wildcardVisionPreparing = false;
  let wildcardVisionRequested = false;
  let wildcardVisionTriggered = false;
  let preparedWildcardVision: {
    imageBytes: string;
    videoUri: string | null;
  } | null = null;
  let wildcardVisionStartTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardVisionEndTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGameOverTriggered = false;
  let wildcardGameOverEndTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGoodEndingPreparing = false;
  let wildcardGoodEndingTriggered = false;
  let preparedWildcardGoodEnding: {
    imageBytes: string;
    videoUri: string | null;
  } | null = null;
  let wildcardGoodEndingStartTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGoodEndingEndTimer: ReturnType<typeof setTimeout> | null = null;
  let cardPickupKeywordPhase = false; // True after acecard_reveal_01 plays — keyword listener listens for card pickup words
  let acecardHintTimer: ReturnType<typeof setTimeout> | null = null; // 12s silence hint at step 23
  let matrixMentionCount = 0; // Matrix easter egg — triggers at 3 mentions

  const clearCardAutoPickTimers = () => {
    if (card1AutoPickTimer) {
      clearTimeout(card1AutoPickTimer);
      card1AutoPickTimer = null;
    }
    if (card2AutoPickTimer) {
      clearTimeout(card2AutoPickTimer);
      card2AutoPickTimer = null;
    }
  };

  const clearWildcardTimers = () => {
    if (wildcardVisionStartTimer) {
      clearTimeout(wildcardVisionStartTimer);
      wildcardVisionStartTimer = null;
    }
    if (wildcardVisionEndTimer) {
      clearTimeout(wildcardVisionEndTimer);
      wildcardVisionEndTimer = null;
    }
    if (wildcardGameOverEndTimer) {
      clearTimeout(wildcardGameOverEndTimer);
      wildcardGameOverEndTimer = null;
    }
    if (wildcardGoodEndingStartTimer) {
      clearTimeout(wildcardGoodEndingStartTimer);
      wildcardGoodEndingStartTimer = null;
    }
    if (wildcardGoodEndingEndTimer) {
      clearTimeout(wildcardGoodEndingEndTimer);
      wildcardGoodEndingEndTimer = null;
    }
    clearAcecardTimers(acecardGateState);
    if (acecardHintTimer) {
      clearTimeout(acecardHintTimer);
      acecardHintTimer = null;
    }
  };

  const maybeEmitPreparedWildcardVision = () => {
    if (
      !wildcardVisionRequested ||
      wildcardVisionTriggered ||
      !preparedWildcardVision ||
      ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    wildcardVisionTriggered = true;
    clearWildcardTimers();

    ws.send(
      JSON.stringify({
        type: "hud_glitch",
        intensity: "high",
        duration_ms: 1200,
      }),
    );
    ws.send(
      JSON.stringify({
        type: "slotsky_trigger",
        payload: { anomalyType: "wildcard_vision_feed_start" },
      }),
    );

    wildcardVisionStartTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN || !preparedWildcardVision) return;

      jasonManager.sendText(
        "There's a feed coming in through my glasses. I did not activate this myself.",
      );

      ws.send(
        JSON.stringify({
          type: "scene_change",
          payload: { sceneKey: "wildcard_vision_feed" },
        }),
      );
      ws.send(
        JSON.stringify({
          type: "scene_image",
          agent: "gm",
          sessionId,
          payload: {
            sceneKey: "wildcard_vision_feed",
            data: preparedWildcardVision.imageBytes,
          },
          timestamp: Date.now(),
        }),
      );

      if (preparedWildcardVision.videoUri) {
        ws.send(
          JSON.stringify({
            type: "slotsky_trigger",
            payload: { anomalyType: "wildcard_scare_sfx" },
          }),
        );
        ws.send(
          JSON.stringify({
            type: "scene_video",
            agent: "gm",
            sessionId,
            payload: {
              sceneKey: "wildcard_vision_feed",
              mediaId: "hallway_pov_01",
              triggerType: "hold_for_input",
              timeoutSeconds: 15,
              audioMode: "native_audio",
              url: preparedWildcardVision.videoUri,
            },
            timestamp: Date.now(),
          }),
        );
      }

      wildcardVisionEndTimer = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        currentSequenceStep = 12;
        lastPlayerSpeechAt = Date.now();
        ws.send(
          JSON.stringify({
            type: "slotsky_trigger",
            payload: { anomalyType: "wildcard_vision_feed_end" },
          }),
        );
        ws.send(
          JSON.stringify({
            type: "hud_glitch",
            intensity: "medium",
            duration_ms: 900,
          }),
        );
        void (async () => {
          await handleGmFunctionCall(
            sessionId,
            "triggerSceneChange",
            { sceneKey: "tunnel_to_park_transition" },
            ws,
            jasonManager,
          );
          lastInjectedSceneKey = "tunnel_to_park_transition";
          lastInjectedSceneAt = Date.now();
          injectSceneContextIntoJason(
            "tunnel_to_park_transition",
            jasonManager,
          );
          startStepTimer(12);
          keywordListener.updateKeywords(12);
        })().catch((err: Error) => {
          console.error(
            `[WS] wildcard transition follow-through failed for session ${sessionId}:`,
            err.message,
          );
        });
      }, 8_500);
    }, 700);
  };

  const maybePrepareWildcardVision = () => {
    if (
      wildcardVisionPreparing ||
      preparedWildcardVision ||
      !latestPlayerFrame
    ) {
      return;
    }

    wildcardVisionPreparing = true;
    console.log(`[WS] Starting wildcard vision prep for session ${sessionId}`);

    void (async () => {
      const edited = await generateEditedSceneImage(
        "wildcard_vision_feed",
        latestPlayerFrame!,
      );
      if (!edited) {
        wildcardVisionPreparing = false;
        return;
      }

      const videoUri = await generateSceneVideo(
        "wildcard_vision_feed",
        edited.imageBytes,
      );
      preparedWildcardVision = {
        imageBytes: edited.imageBytes,
        videoUri,
      };
      wildcardVisionPreparing = false;
      console.log(`[WS] Wildcard vision prep ready for session ${sessionId}`);
      maybeEmitPreparedWildcardVision();
    })().catch((err: Error) => {
      wildcardVisionPreparing = false;
      console.error(
        `[WS] wildcard vision prep failed for session ${sessionId}:`,
        err.message,
      );
    });
  };

  const queueWildcardVisionPlayback = () => {
    wildcardVisionRequested = true;
    maybePrepareWildcardVision();
    maybeEmitPreparedWildcardVision();
  };

  const waitForPreparedWildcard = async (
    kind: "wildcard_good_ending",
    timeoutMs = 25_000,
    pollMs = 500,
  ): Promise<boolean> => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (preparedWildcardGoodEnding && preparedWildcardGoodEnding.videoUri) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
    return false;
  };

  // WILDCARD2 (game_over) is frontend-only — no AI generation needed.
  // Keep the function as a no-op so existing callers don't break.
  const maybePrepareWildcardGameOver = () => {
    // No-op: game_over uses frontend effects only (glitches, screams, game_over event).
  };

  const maybePrepareWildcardGoodEnding = () => {
    if (wildcardGoodEndingPreparing || preparedWildcardGoodEnding) {
      return;
    }

    wildcardGoodEndingPreparing = true;
    console.log(
      `[WS] Starting wildcard_good_ending prep for session ${sessionId}`,
    );

    void (async () => {
      const imageBytes = await generateSceneImage("wildcard_good_ending");
      if (!imageBytes) {
        wildcardGoodEndingPreparing = false;
        return;
      }

      const videoUri = await generateSceneVideo(
        "wildcard_good_ending",
        imageBytes,
      );
      preparedWildcardGoodEnding = {
        imageBytes,
        videoUri,
      };
      wildcardGoodEndingPreparing = false;
      console.log(
        `[WS] wildcard_good_ending prep ready for session ${sessionId}`,
      );
    })().catch((err: Error) => {
      wildcardGoodEndingPreparing = false;
      console.error(
        `[WS] wildcard_good_ending prep failed for session ${sessionId}:`,
        err.message,
      );
    });
  };

  const scheduleWildcardPrewarmFromHallwayStill = () => {
    // Hallway hold is the earliest reliable point to begin pre-building both ending branches.
    // We kick preparation now and also at +90s to satisfy the late-prewarm guardrail.
    maybePrepareWildcardGameOver();
    maybePrepareWildcardGoodEnding();

    setTimeout(() => {
      maybePrepareWildcardGameOver();
      maybePrepareWildcardGoodEnding();
    }, 90_000);
  };

  // WILDCARD2 (game_over) — frontend-only: glitch effects, slotsky, then game_over.
  // No AI-generated scene_image or scene_video.
  const emitWildcardGameOverBranch = async () => {
    if (wildcardGameOverTriggered) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "game_over" }));
      }
      return;
    }

    wildcardGameOverTriggered = true;

    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "hud_glitch",
        intensity: "high",
        duration_ms: 1200,
      }),
    );
    ws.send(
      JSON.stringify({
        type: "slotsky_trigger",
        payload: { anomalyType: "wildcard_game_over_loading" },
      }),
    );
    ws.send(
      JSON.stringify({
        type: "slotsky_trigger",
        payload: { anomalyType: "wildcard_game_over_start" },
      }),
    );

    // Short delay for frontend glitch effects, then send game_over
    wildcardGameOverEndTimer = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "game_over" }));
      }
    }, 3_000);
  };

  const queueWildcardGoodEndingPlayback = async () => {
    if (wildcardGoodEndingTriggered || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    wildcardGoodEndingTriggered = true;

    if (!preparedWildcardGoodEnding) {
      maybePrepareWildcardGoodEnding();
      const ready = await waitForPreparedWildcard("wildcard_good_ending");
      if (!ready) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "good_ending" }));
        }
        return;
      }
    }

    ws.send(
      JSON.stringify({
        type: "hud_glitch",
        intensity: "high",
        duration_ms: 1100,
      }),
    );
    ws.send(
      JSON.stringify({
        type: "slotsky_trigger",
        payload: { anomalyType: "wildcard_good_ending_loading" },
      }),
    );
    ws.send(
      JSON.stringify({
        type: "wildcard3_trigger",
        payload: { sceneKey: "wildcard_good_ending" },
      }),
    );

    wildcardGoodEndingStartTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN || !preparedWildcardGoodEnding)
        return;

      jasonManager.sendText(
        "What the hell... I am not where I was. Audrey, I can hear you.",
      );
      audreyManager.sendText(
        "[AUDREY_TRIGGER: trust=0.65. One short relieved line, distant and echoing.]",
      );

      ws.send(
        JSON.stringify({
          type: "scene_change",
          payload: { sceneKey: "wildcard_good_ending" },
        }),
      );
      ws.send(
        JSON.stringify({
          type: "scene_image",
          agent: "gm",
          sessionId,
          payload: {
            sceneKey: "wildcard_good_ending",
            mediaId: "wildcard_good_ending",
            triggerType: "hold_for_input",
            timeoutSeconds: 8,
            data: preparedWildcardGoodEnding.imageBytes,
          },
          timestamp: Date.now(),
        }),
      );

      if (preparedWildcardGoodEnding.videoUri) {
        ws.send(
          JSON.stringify({
            type: "scene_video",
            agent: "gm",
            sessionId,
            payload: {
              sceneKey: "wildcard_good_ending",
              mediaId: "wildcard_good_ending",
              triggerType: "hold_for_input",
              timeoutSeconds: 8,
              audioMode: "native_audio",
              url: preparedWildcardGoodEnding.videoUri,
            },
            timestamp: Date.now(),
          }),
        );
      }

      wildcardGoodEndingEndTimer = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "good_ending" }));
        }
      }, 8_500);
    }, 700);
  };

  const playCard1PickupThenQueueWildcard = () => {
    void (async () => {
      await handleGmFunctionCall(
        sessionId,
        "triggerSceneChange",
        { sceneKey: "card1_pickup_pov" },
        ws,
        jasonManager,
      );

      // Wait for the wildcard vision to finish preparing (Imagen + Veo).
      // The card_pickup_01 clip plays ~8s — use that window plus extra buffer.
      // If Veo fails fast the prep resolves quickly; if it succeeds we wait up to 20s.
      // Either way we emit whatever is ready (still-only is acceptable).
      const waitStart = Date.now();
      const maxWaitMs = 20_000;
      const pollMs = 500;
      while (
        !preparedWildcardVision &&
        Date.now() - waitStart < maxWaitMs &&
        ws.readyState === WebSocket.OPEN
      ) {
        maybePrepareWildcardVision();
        await new Promise((r) => setTimeout(r, pollMs));
      }
      // Ensure at least 6.5s elapsed so the card pickup clip has time to play.
      const elapsed = Date.now() - waitStart;
      if (elapsed < 6_500) {
        await new Promise((r) => setTimeout(r, 6_500 - elapsed));
      }
      queueWildcardVisionPlayback();
    })().catch((err: Error) => {
      console.error(
        `[WS] card1 pickup transition failed for session ${sessionId}:`,
        err.message,
      );
    });
  };

  const clearStepTimer = () => {
    if (stepWallClockTimer) {
      clearTimeout(stepWallClockTimer);
      stepWallClockTimer = null;
    }
  };

  const stopInteractionTimers = () => {
    if (npcIdleNudgeTimer) {
      clearInterval(npcIdleNudgeTimer);
      npcIdleNudgeTimer = null;
    }
    clearStepTimer();
  };

  const startInteractionTimers = () => {
    stopInteractionTimers();
    clearCardAutoPickTimers();
    lastPlayerSpeechAt = Date.now();

    npcIdleNudgeTimer = setInterval(() => {
      if (!jasonReadyForPlayer || ws.readyState !== WebSocket.OPEN) return;
      const secondsSilent = Math.floor(
        (Date.now() - lastPlayerSpeechAt) / 1000,
      );
      if (secondsSilent < 9) return;
      const urgency = secondsSilent >= 18 ? "urgent" : "soft";

      ws.send(
        JSON.stringify({
          type: "npc_idle_nudge",
          payload: {
            phase: "phase4_interaction",
            secondsSilent,
            urgency,
          },
        }),
      );

      ws.send(
        JSON.stringify({
          type: "overlay_text",
          payload: {
            text:
              urgency === "urgent" ? "Talk to Jason now." : "Talk to Jason.",
            variant: urgency === "urgent" ? "idle_urgent" : "idle_soft",
            durationMs: urgency === "urgent" ? 2400 : 1800,
          },
        }),
      );
    }, 9_000);

    // Start the wall-clock timer for the current step
    startStepTimer(currentSequenceStep);
  };

  // ── advanceStep: unified step progression (keyword OR timer) ────────────
  // Both the keyword listener callback and the wall-clock timer call this.
  // The stepAdvancing mutex prevents double-fire from race conditions.
  const advanceStep = (fromStep: number, reason: "keyword" | "timeout") => {
    if (stepAdvancing) return;
    if (fromStep !== currentSequenceStep) return;
    if (fromStep === 11 || fromStep >= 23) return; // terminal — card hold or acecard gate
    if (ws.readyState !== WebSocket.OPEN) return;

    stepAdvancing = true;
    clearStepTimer();

    const toStep = getNextAutoplayStep(fromStep);
    currentSequenceStep = toStep;
    lastPlayerSpeechAt = Date.now(); // Reset idle nudge baseline

    console.log(
      `[WS] Step advance: ${fromStep} → ${toStep} (${reason}) for session ${sessionId}`,
    );

    // Clear hint timer if flashlight just fired
    if (fromStep === 7) {
      if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
      }
    }

    ws.send(
      JSON.stringify({
        type: "autoplay_advance",
        payload: {
          fromStep,
          toStep,
          mediaId: STEP_MEDIA_TRIGGER[fromStep]?.mediaId ?? null,
          triggerType:
            STEP_MEDIA_TRIGGER[fromStep]?.triggerType ?? "hold_for_input",
          timeoutSeconds: getStepTimeoutSeconds(fromStep),
          reason,
        },
      }),
    );

    void (async () => {
      try {
        if (!gmGated) {
          stepAdvancing = false;
          startStepTimer(toStep);
          return;
        }

        const action = STEP_AUTOPLAY_ACTIONS[fromStep];
        if (action) {
          // Only inject autoplay narration into Jason on hold_for_input steps
          // (where the player is expected to speak). Chained_auto steps fire
          // in rapid succession — flooding Jason with sendText calls prevents
          // him from hearing/responding to the player's actual voice.
          const stepMeta = STEP_MEDIA_TRIGGER[fromStep];
          if (
            !stepMeta ||
            stepMeta.triggerType === "hold_for_input" ||
            reason === "keyword"
          ) {
            jasonManager.sendText(
              reason === "keyword"
                ? action.autoplayText.replace(
                    "[AUTOPLAY_TIMEOUT: No player response. ",
                    "[KEYWORD_TRIGGERED: ",
                  )
                : action.autoplayText,
            );
          }
          for (let i = 0; i < action.gmCalls.length; i++) {
            const call = action.gmCalls[i];
            await handleGmFunctionCall(
              sessionId,
              call.fnName,
              call.args,
              ws,
              // Don't pass jasonManager for chained_auto steps — startClipCues
              // fires jason_dialogue cues that use sendClientContent, which resets
              // Gemini's VAD state and discards any in-flight player audio.
              // This was the root cause of Jason ignoring the player post-WILDCARD1.
              stepMeta?.triggerType === "chained_auto" ? undefined : jasonManager,
            );
            // 120ms gap between WS sends so React 18+ automatic batching
            // doesn't swallow the scene_change event when the next event
            // (video_gen_started / card_discovered) overwrites lastEvent.
            if (i < action.gmCalls.length - 1) {
              await new Promise((r) => setTimeout(r, 120));
            }
          }

          // Inject scene visual context into Jason only on hold_for_input steps.
          // Chained_auto steps advance too rapidly — injecting context for each
          // brief clip prevents Jason from responding to the player.
          // Dedup: skip if the same scene was injected within the last 10s (prevents
          // double-fire from GM + step machine both triggering the same scene).
          const sceneCall = action.gmCalls.find(
            (c) => c.fnName === "triggerSceneChange",
          );
          if (
            sceneCall &&
            (!stepMeta || stepMeta.triggerType === "hold_for_input")
          ) {
            const sk = sceneCall.args.sceneKey as string;
            const now = Date.now();
            if (
              sk !== lastInjectedSceneKey ||
              now - lastInjectedSceneAt > 10_000
            ) {
              lastInjectedSceneKey = sk;
              lastInjectedSceneAt = now;
              injectSceneContextIntoJason(sk, jasonManager);
            } else {
              console.log(
                `[WS] Skipped duplicate scene context injection for "${sk}" — session=${sessionId}`,
              );
            }
          }

          // Handle step extras (card auto-pick, wildcard prewarm, acecard gate)
          if (action.extra === "card1_auto_pick") {
            // Delay card_discovered by 16s — card_joker_01.mp4 is 15s long.
            // The card icon must NOT appear during clip playback. It appears
            // only after the clip ends and the still (card_joker_01.png) loads.
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "card_discovered",
                    cardId: "card1",
                    timestamp: Date.now(),
                  }),
                );
                console.log(
                  `[WS] Delayed card_discovered(card1) emitted for session ${sessionId}`,
                );
              }
            }, 16_000);
            if (!card1Collected && !card1AutoPickTimer) {
              card1AutoPickTimer = setTimeout(() => {
                if (card1Collected) return;
                card1Collected = true;
                void handleCardCollected("card1", sessionId, jasonManager, ws)
                  .then(() => {
                    playCard1PickupThenQueueWildcard();
                  })
                  .catch((err: Error) => {
                    console.error(
                      `[WS] card1 auto-pick failed for session ${sessionId}:`,
                      err.message,
                    );
                  });
              }, 60_000);
            }
          } else if (action.extra === "card2_hunt_and_prewarm") {
            maybePrepareWildcardGameOver();
            maybePrepareWildcardGoodEnding();
            if (card2AutoPickTimer) {
              clearTimeout(card2AutoPickTimer);
              card2AutoPickTimer = null;
            }
          } else if (action.extra === "hallway_pov_02_all") {
            // Delay card_discovered by 3s so the hallway_pov_02 scene
            // has time to load on the frontend before the card overlay appears.
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "card_discovered",
                    cardId: "card2",
                    timestamp: Date.now(),
                  }),
                );
                console.log(
                  `[WS] Delayed card_discovered(card2) emitted for session ${sessionId}`,
                );
              }
            }, 3_000);
            maybePrepareWildcardGameOver();
            maybePrepareWildcardGoodEnding();
            if (card2AutoPickTimer) {
              clearTimeout(card2AutoPickTimer);
              card2AutoPickTimer = null;
            }
            startAcecardKeywordTimer(acecardGateState, ws, sessionId, () => {
              void emitWildcardGameOverBranch();
            });
            // Notify GM that the acecard keyword window is open so it can fire triggerAcecardReveal
            gmManager.sendText(
              "[ACECARD_WINDOW_OPEN: The hallway_pov_02 scene is now active. " +
                "The 30-second acecard keyword window has started. Listen for the player to say " +
                "ANYTHING about finding, opening, grabbing, or looking at a panel, wall, or hidden object. " +
                "If you hear such an instruction, call triggerAcecardReveal IMMEDIATELY.]",
            );
            // Belt-and-suspenders: explicitly push step 23 keywords to the keyword listener.
            // updateKeywords() below also does this, but pushKeywords bypasses step dedup.
            keywordListener.pushKeywords(getKeywordListForStep(23));
            // 12s silence hint — if the player hasn't spoken, nudge them
            if (acecardHintTimer) {
              clearTimeout(acecardHintTimer);
              acecardHintTimer = null;
            }
            acecardHintTimer = setTimeout(() => {
              acecardHintTimer = null;
              if (
                ws.readyState === WebSocket.OPEN &&
                !acecardGateState.acecardKeywordReceived
              ) {
                ws.send(
                  JSON.stringify({
                    type: "overlay_text",
                    payload: {
                      text: "Search the walls… there must be something hidden.",
                      variant: "hint",
                      durationMs: 4000,
                    },
                  }),
                );
                console.log(
                  `[WS] Acecard silence hint sent — session=${sessionId}`,
                );
              }
            }, 12_000);
          }
        }

        // Update keyword listener for the new step
        keywordListener.updateKeywords(toStep);

        // Start the wall-clock timer for the new step
        startStepTimer(toStep);
      } catch (err) {
        console.error(
          `[WS] advanceStep failed for session ${sessionId}:`,
          (err as Error).message,
        );
      } finally {
        stepAdvancing = false;
      }
    })();
  };

  // ── startStepTimer: wall-clock setTimeout per step ──────────────────────
  // Timer runs independently of player speech. If a keyword fires first,
  // the timer is cancelled. If no keyword fires, timer expires and advances.
  const startStepTimer = (step: number) => {
    clearStepTimer();
    if (step === 11 || step >= 23) return; // terminal — card hold or acecard gate
    if (!jasonReadyForPlayer || ws.readyState !== WebSocket.OPEN) return;

    const timeoutMs = getStepTimeoutSeconds(step) * 1000;
    stepWallClockTimer = setTimeout(() => {
      stepWallClockTimer = null;
      advanceStep(step, "timeout");
    }, timeoutMs);

    console.log(
      `[WS] Step ${step} wall-clock timer started: ${getStepTimeoutSeconds(step)}s for session ${sessionId}`,
    );
  };

  console.log(`[WS] Client connected - session ${sessionId}`);
  // Register for debug endpoint access
  debugSessions.set(sessionId, { ws, jasonManager });

  // Init Firestore session + both Gemini Live sessions asynchronously.
  // Send SESSION_READY once all are established.
  (async () => {
    try {
      const sessionData = await getOrCreateSession(sessionId);

      // Jason NPC session - audio out to player
      const jasonPrompt = getJasonSystemPrompt(
        sessionData.trustLevel,
        sessionData.fearIndex,
      );
      await jasonManager.connect(jasonPrompt, "npc");

      jasonManager.onAgentAudio((base64Audio) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "agent_speech",
              agent: "jason",
              audio: base64Audio,
            }),
          );
        }
      });

      jasonManager.onAgentInterrupt(() => {
        // Forward interrupt to the frontend so it flushes Jason's buffered audio.
        // Without this the frontend keeps playing queued audio chunks even after
        // Gemini has stopped generating, making it appear Jason can't be interrupted.
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "agent_interrupt", agent: "jason" }));
        }
      });

      // Audrey NPC session - Aoede voice, single echo, trust-gated
      const audreyPrompt = getAudreySystemPrompt();
      await audreyManager.connect(audreyPrompt, "npc", "Aoede");

      audreyManager.onAgentAudio((base64Audio) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "agent_speech",
              agent: "audrey",
              audio: base64Audio,
            }),
          );
        }
      });

      // Keyword listener session - listens for per-step keywords in player audio
      await keywordListener.connect(7); // Start with step 7 keywords (flashlight)
      keywordListener.onKeywordDetected((keyword) => {
        console.log(
          `[KW] Keyword "${keyword}" detected at step ${currentSequenceStep} (pickupPhase=${cardPickupKeywordPhase}) — session=${sessionId}`,
        );

        // Matrix easter egg — 3 mentions triggers green screen + Jason quote
        if (keyword.toLowerCase().includes("matrix")) {
          matrixMentionCount++;
          console.log(
            `[KW] Matrix mention #${matrixMentionCount} — session=${sessionId}`,
          );
          if (matrixMentionCount === 3 && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "matrix_easter_egg",
                payload: { durationMs: 6000 },
              }),
            );
            jasonManager.sendText(
              "[MATRIX_EASTER_EGG: The player has mentioned 'The Matrix' three times. " +
                "Your smartglasses display just glitched — green characters cascading down " +
                "the screen like digital rain. React with one short, unsettled line referencing " +
                "the glitch. Something like: 'What the— did you see that? Green… everywhere. " +
                "Like that old movie.' or 'My display just went full Morpheus on me. " +
                "What if I told you… none of this is real?' Keep it brief and unnerved.]",
            );
            console.log(
              `[KW] Matrix easter egg triggered! — session=${sessionId}`,
            );
          }
          return; // Don't process "matrix" as a step keyword
        }

        // Card pickup phase — voice-triggered card2 collection
        if (cardPickupKeywordPhase) {
          cardPickupKeywordPhase = false;
          if (acecardGateState.cardPickup02Timer !== null) {
            clearTimeout(acecardGateState.cardPickup02Timer);
            acecardGateState.cardPickup02Timer = null;
          }
          if (card2AutoPickTimer) {
            clearTimeout(card2AutoPickTimer);
            card2AutoPickTimer = null;
          }
          console.log(
            `[KW] Voice-triggered card2 pickup — session=${sessionId}`,
          );
          handleCardCollected("card2", sessionId, jasonManager, ws, {
            deferGoodEnding: true,
          })
            .then(() => {
              queueWildcardGoodEndingPlayback();
            })
            .catch((err: Error) => {
              console.error(`[KW] card2 voice-pickup error: ${err.message}`);
            });
          return;
        }

        // Step 23 (hallway) — keyword triggers acecard reveal instead of advanceStep
        if (currentSequenceStep >= 23) {
          if (acecardHintTimer) {
            clearTimeout(acecardHintTimer);
            acecardHintTimer = null;
          }
          handleAcecardReveal(acecardGateState, ws);
          return;
        }

        advanceStep(currentSequenceStep, "keyword");
      });

      // GM session - silent, function calls only, no audio back to player
      const gmPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      await gmManager.connect(gmPrompt, "gm");

      gmManager.onFunctionCall((id, name, args) => {
        // Gate scene/video events until the frontend sends intro_complete.
        // Prevents the GM from firing Beat 2 scene changes during Beat 1 darkness.
        if (!gmGated && name === "triggerSceneChange") {
          console.log(`[GM] ${name} blocked pre-intro - session=${sessionId}`);
          gmManager.sendToolResponse(id, name);
          return;
        }
        // Track scene changes for B11 hint timer.
        if (name === "triggerSceneChange") {
          sceneChangeCount++;
          // Sync step machine when GM fires flashlight — prevents autoplay from re-firing step 7.
          if (
            (args.sceneKey as string) === "flashlight_beam" &&
            currentSequenceStep === 7
          ) {
            currentSequenceStep = 8;
            clearStepTimer();
            startStepTimer(8);
            keywordListener.updateKeywords(8);
            if (hintTimer) {
              clearTimeout(hintTimer);
              hintTimer = null;
            }
            console.log(
              `[WS] GM fired flashlight_beam — step synced to 8 for session ${sessionId}`,
            );
          }
        }
        // If acecard keyword timer is already running and the GM calls triggerDreadTimerStart,
        // treat it as a no-op — startAcecardKeywordTimer() already owns this timer slot at step 31.
        if (
          name === "triggerDreadTimerStart" &&
          acecardGateState.acecardKeywordTimer !== null
        ) {
          console.log(
            `[GM] triggerDreadTimerStart skipped — acecard keyword timer already running for session ${sessionId}`,
          );
          gmManager.sendToolResponse(id, name);
          return;
        }
        // Always ACK the tool call back to Gemini - even if the WS is closed.
        // If we skip the ACK, Gemini hangs permanently waiting for a response.
        // handleGmFunctionCall already guards ws.readyState internally before sending.
        //
        // Trust-gate Audrey: only register the callback when trust is sufficient.
        // getOrCreateSession is cheap here - we only fire once per session at beat 6.
        const audreyCallback = (trustLevel: number) => {
          const trustTag =
            trustLevel >= 0.7
              ? 'HIGH - sound hopeful. Call out "Jason?" softly. You sense he might be close.'
              : trustLevel < 0.4
                ? "LOW - you are crying quietly. Do not use his name. You feel very far away."
                : "NEUTRAL - scared but holding it together. One short sentence. Muffled, echoing.";
          audreyManager.sendText(
            `[AUDREY_TRIGGER: trust=${trustLevel.toFixed(2)}. ${trustTag} ` +
              "Speak once. 1 sentence maximum. Then go completely silent.]",
          );
          console.log(
            `[WS] Audrey triggered - trust=${trustLevel.toFixed(2)} session=${sessionId}`,
          );
        };
        handleGmFunctionCall(
          sessionId,
          name,
          args,
          ws,
          jasonManager,
          (trustLevel) => {
            audreyCallback(trustLevel);
          },
          async () => {
            await emitWildcardGameOverBranch();
          },
          () => {
            handleAcecardReveal(acecardGateState, ws);
          },
        ).finally(() => {
          gmManager.sendToolResponse(id, name);
        });
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "session_ready", session_id: sessionId }),
        );
        // BLACK SCREEN START - no image generation on session open.
        // The game begins in darkness. Player hears only audio (SFX + JASON voice).
        // Scene images are generated later when the GM decides (e.g. player suggests flashlight).

        // Jason's intro sequence fires when the frontend sends intro_complete (after title card).
        // At session start Jason does NOT know the smartglasses audio channel is active - see intro_complete handler.
      }
    } catch (err) {
      console.error(`[WS] Failed to init sessions for ${sessionId}:`, err);
      ws.close();
    }
  })();
  ws.on("message", (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      // Frontend signals the intro title card has finished - fire Jason's landing sequence.
      // Jason is hurt, alone, in darkness. He does NOT know the smartglasses audio channel is active yet.
      if (data.type === "intro_complete" && !jasonIntroFired) {
        jasonIntroFired = true;
        gmGated = true; // Unblock GM scene/video events - Beat 1 darkness phase is over
        console.log(
          `[WS] intro_complete received - firing Jason landing sequence for session ${sessionId}`,
        );
        // Pre-warm for wildcard zones happens later when hallway_pov_02 fires.
        // B11: If GM fires no scene change within 45s, nudge the player to ask about a flashlight.
        hintTimer = setTimeout(() => {
          if (sceneChangeCount === 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "hint",
                text: "ask him if he has a flashlight",
              }),
            );
            console.log(
              `[WS] Hint sent - no scene change after 45s for session ${sessionId}`,
            );
          }
        }, 45_000);
        jasonManager.sendText(
          "[SESSION_START: You came to in pitch darkness after a hard fall underground. " +
            "You are hurt but functional. Dead silence except for distant dripping water. You cannot see. " +
            "Call out for Audrey. Call out for Josh. You get no answer. " +
            "You are completely alone in the dark. The smartglasses audio channel is live but you have not noticed it yet. " +
            "DO NOT narrate or describe your physical state or injuries. " +
            "DO NOT address anyone through the channel yet. " +
            "React naturally to the darkness and the silence.]",
        );
        // One-time radio static SFX at landing — this is the ONLY radio static in the session.
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "clip_sfx",
              payload: { sfx: "radio_static", mediaId: "session_start" },
            }),
          );
        }
        // Gate player audio to Jason for 10s - covers Gemini latency + landing monologue duration.
        // After 10s: flip the gate and tell the frontend to show the "speak to JASON" hint.
        jasonReadyTimer = setTimeout(() => {
          jasonReadyForPlayer = true;
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "player_speak_prompt" }));
            ws.send(
              JSON.stringify({
                type: "overlay_text",
                payload: {
                  text: "TALK",
                  variant: "talk_prompt",
                  durationMs: 1800,
                },
              }),
            );
          }
          startInteractionTimers();
          console.log(
            `[WS] jasonReadyForPlayer = true - player_speak_prompt sent for session ${sessionId}`,
          );
        }, 10_000);
        return;
      }

      // Route Game Master function call events
      if (
        data.type === "GM_FUNCTION_CALL" &&
        data.sessionId &&
        data.functionName
      ) {
        handleGmFunctionCall(
          data.sessionId,
          data.functionName,
          data.args ?? {},
          ws,
          jasonManager,
          undefined,
          async () => {
            await emitWildcardGameOverBranch();
          },
          () => {
            handleAcecardReveal(acecardGateState, ws);
          },
        );
        return;
      }

      // Player speech - base64 PCM audio from the browser to Jason NPC + GM (for trust evaluation)
      if (data.type === "player_speech" && data.audio) {
        console.log(
          `[WS] player_speech received - b64 bytes: ${(data.audio as string).length}`,
        );
        // Drop all player audio until Jason's landing monologue completes (~18s after intro_complete).
        // Prevents ambient mic bleed from triggering Jason before the channel is discovered.
        if (!jasonReadyForPlayer) return;
        lastPlayerSpeechAt = Date.now();
        // Always forward player audio to Jason — allows Gemini-native barge-in
        // so the player can interrupt Jason's scene narration. Gemini's VAD
        // handles distinguishing genuine player speech from speaker echo.
        jasonManager.sendAudio(data.audio);
        if (gmGated) gmManager.sendAudio(data.audio); // GM hears player only after intro_complete
        keywordListener.sendAudio(data.audio); // Keyword listener always hears player audio
        return;
      }

      // Player webcam frame - base64 JPEG from browser to Game Master (1 FPS, GM vision)
      if (data.type === "player_frame" && data.jpeg) {
        latestPlayerFrame = data.jpeg;
        if (jasonReadyForPlayer) maybePrepareWildcardVision();
        if (gmGated && jasonReadyForPlayer) gmManager.sendFrame(data.jpeg); // Camera feed enters gameplay only after interaction opens
        return;
      }

      // Frontend marker: hallway_pov_02 still is now active.
      // This is the earliest anchor for background pre-generation of wildcard2/wildcard3.
      // Also starts the acecard keyword window timer (30s).
      if (data.type === "hallway_pov_02_ready") {
        scheduleWildcardPrewarmFromHallwayStill();
        startAcecardKeywordTimer(acecardGateState, ws, sessionId, () => {
          void emitWildcardGameOverBranch();
        });
        // LS_VIDEO_PIPELINE step 23: immediate visual hint — panel is hidden
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "overlay_text",
              payload: {
                text: "Maybe there's a panel somewhere?",
                variant: "hint",
                durationMs: 3000,
              },
            }),
          );
        }
        return;
      }

      // Frontend signals the acecard_reveal_01.mp4 clip has finished playing.
      // Backend starts the 15s card_pickup_02 click window.
      if (data.type === "acecard_reveal_complete") {
        startCardPickup02Timer(acecardGateState, ws, sessionId, () => {
          void emitWildcardGameOverBranch();
        });
        // Enable voice-triggered card pickup via keyword listener
        cardPickupKeywordPhase = true;
        keywordListener.pushKeywords(CARD_PICKUP_KEYWORDS);
        return;
      }

      // Card collected - player clicked a collectible card overlay
      if (data.type === "card_collected" && data.cardId) {
        if (data.cardId === "card1") {
          card1Collected = true;
          if (card1AutoPickTimer) {
            clearTimeout(card1AutoPickTimer);
            card1AutoPickTimer = null;
          }
        }
        if (data.cardId === "card2") {
          if (card2AutoPickTimer) {
            clearTimeout(card2AutoPickTimer);
            card2AutoPickTimer = null;
          }
          if (acecardGateState.cardPickup02Timer !== null) {
            clearTimeout(acecardGateState.cardPickup02Timer);
            acecardGateState.cardPickup02Timer = null;
          }
        }
        handleCardCollected(data.cardId, sessionId, jasonManager, ws, {
          deferGoodEnding: data.cardId === "card2",
        })
          .then(() => {
            if (data.cardId === "card1") playCard1PickupThenQueueWildcard();
            if (data.cardId === "card2") queueWildcardGoodEndingPlayback();
          })
          .catch((err: Error) => {
            console.error(
              `[WS] card_collected handler error for session ${sessionId}:`,
              err.message,
            );
          });
        return;
      }

      // Player text - direct text message (used for testing / GM commands)
      if (data.type === "player_text" && data.text) {
        jasonManager.sendText(data.text);
        return;
      }
    } catch {
      // Raw binary fallback - forward to Jason NPC
      jasonManager.sendAudio(message.toString("base64"));
    }
  });

  ws.on("close", () => {
    console.log(`[WS] Client disconnected - session ${sessionId}`);
    clearInterval(pingInterval);
    if (hintTimer) clearTimeout(hintTimer);
    if (jasonReadyTimer) clearTimeout(jasonReadyTimer);
    if (acecardHintTimer) clearTimeout(acecardHintTimer);
    clearStepTimer();
    stopInteractionTimers();
    clearCardAutoPickTimers();
    clearWildcardTimers();
    debugSessions.delete(sessionId);
    clearImageCache(sessionId);
    clearGlitchThrottle(sessionId);
    clearClipCues(sessionId);
    jasonManager.disconnect();
    audreyManager.disconnect();
    gmManager.disconnect();
    keywordListener.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(
    `[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`,
  );
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});
