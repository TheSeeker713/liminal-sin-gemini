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
} from "./services/gameMaster";
import {
  prewarmImageCache,
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
    res.status(403).json({ error: "Debug endpoint disabled. Set DEBUG_GM_ENDPOINT=true." });
    return;
  }
  const { jpeg } = req.body as { jpeg?: string };
  if (!jpeg) {
    res.status(400).json({ error: "Body must contain { jpeg: '<base64 string>' }" });
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
      editError = "generateEditedSceneImage returned null (possible RAI block — check server logs)";
    }
  } catch (err) {
    editError = String(err);
  }

  // Step 2 — Veo (only if edit succeeded)
  if (editedImageBytes) {
    try {
      const t2 = Date.now();
      videoUri = await generateSceneVideo("wildcard_vision_feed", editedImageBytes);
      videoDurationMs = Date.now() - t2;
      if (!videoUri) {
        videoError = "generateSceneVideo returned null (possible RAI block — check server logs)";
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
        imageBytes: editedImageBytes,   // base64 JPEG
        error: editError,
      },
      veoVideo: {
        success: !!videoUri,
        durationMs: videoDurationMs,
        videoUri,                        // data URI or GCS URI
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
  const gmLiveModel = process.env.GM_LIVE_MODEL || "gemini-live-2.5-flash";
  const jasonManager = new LiveSessionManager(); // NPC - speaks, audio out, Enceladus voice
  const gmManager = new LiveSessionManager(gmLiveModel); // GM - silent, function calls only
  const audreyManager = new LiveSessionManager(); // NPC - single echo, Aoede voice
  let jasonIntroFired = false; // Gates Jason's first line until frontend sends intro_complete
  let gmGated = false; // Gates GM scene/video calls until intro_complete is received
  let jasonReadyForPlayer = false; // Gates player audio to Jason until landing monologue completes
  let jasonReadyTimer: ReturnType<typeof setTimeout> | null = null; // Flips jasonReadyForPlayer after ~18s
  let sceneChangeCount = 0; // Tracks GM-triggered scene changes (used by hint timer)
  let hintTimer: ReturnType<typeof setTimeout> | null = null; // B11: flashlight hint fallback
  let npcIdleNudgeTimer: ReturnType<typeof setInterval> | null = null; // 9s silence nudge loop
  let autoplayAdvanceTimer: ReturnType<typeof setInterval> | null = null; // per-step inactivity auto-advance loop
  let lastPlayerSpeechAt = Date.now();
  let currentSequenceStep = 7; // Phase 4 interaction-open baseline step
  let card1Collected = false;
  let card1AutoPickTimer: ReturnType<typeof setTimeout> | null = null;
  let card2AutoPickTimer: ReturnType<typeof setTimeout> | null = null;
  const acecardGateState = createAcecardGateState();
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
  let wildcardGameOverPreparing = false;
  let wildcardGameOverTriggered = false;
  let preparedWildcardGameOver: {
    imageBytes: string;
    videoUri: string | null;
  } | null = null;
  let wildcardGameOverStartTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGameOverEndTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGoodEndingPreparing = false;
  let wildcardGoodEndingTriggered = false;
  let preparedWildcardGoodEnding: {
    imageBytes: string;
    videoUri: string | null;
  } | null = null;
  let wildcardGoodEndingStartTimer: ReturnType<typeof setTimeout> | null = null;
  let wildcardGoodEndingEndTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (wildcardGameOverStartTimer) {
      clearTimeout(wildcardGameOverStartTimer);
      wildcardGameOverStartTimer = null;
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
        currentSequenceStep = 17;
        lastPlayerSpeechAt = Date.now();
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
          await handleGmFunctionCall(
            sessionId,
            "triggerVideoGen",
            { sceneKey: "tunnel_to_park_transition" },
            ws,
            jasonManager,
          );
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
    kind: "wildcard_game_over" | "wildcard_good_ending",
    timeoutMs = 25_000,
    pollMs = 500,
  ): Promise<boolean> => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (
        kind === "wildcard_game_over" &&
        preparedWildcardGameOver &&
        preparedWildcardGameOver.videoUri
      ) {
        return true;
      }
      if (
        kind === "wildcard_good_ending" &&
        preparedWildcardGoodEnding &&
        preparedWildcardGoodEnding.videoUri
      ) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
    return false;
  };

  const maybePrepareWildcardGameOver = () => {
    if (wildcardGameOverPreparing || preparedWildcardGameOver) {
      return;
    }

    wildcardGameOverPreparing = true;
    console.log(
      `[WS] Starting wildcard_game_over prep for session ${sessionId}`,
    );

    void (async () => {
      const imageBytes = await generateSceneImage("wildcard_game_over");
      if (!imageBytes) {
        wildcardGameOverPreparing = false;
        return;
      }

      const videoUri = await generateSceneVideo("wildcard_game_over", imageBytes);
      preparedWildcardGameOver = {
        imageBytes,
        videoUri,
      };
      wildcardGameOverPreparing = false;
      console.log(
        `[WS] wildcard_game_over prep ready for session ${sessionId}`,
      );
    })().catch((err: Error) => {
      wildcardGameOverPreparing = false;
      console.error(
        `[WS] wildcard_game_over prep failed for session ${sessionId}:`,
        err.message,
      );
    });
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

  const emitWildcardGameOverBranch = async () => {
    if (wildcardGameOverTriggered) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "game_over" }));
      }
      return;
    }

    wildcardGameOverTriggered = true;
    if (!preparedWildcardGameOver) {
      maybePrepareWildcardGameOver();
      const ready = await waitForPreparedWildcard("wildcard_game_over");
      if (!ready) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "game_over" }));
        }
        return;
      }
    }

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

    wildcardGameOverStartTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN || !preparedWildcardGameOver) return;

      ws.send(
        JSON.stringify({
          type: "scene_change",
          payload: { sceneKey: "wildcard_game_over" },
        }),
      );
      ws.send(
        JSON.stringify({
          type: "scene_image",
          agent: "gm",
          sessionId,
          payload: {
            sceneKey: "wildcard_game_over",
            mediaId: "wildcard_game_over",
            triggerType: "hold_for_input",
            timeoutSeconds: 8,
            data: preparedWildcardGameOver.imageBytes,
          },
          timestamp: Date.now(),
        }),
      );

      if (preparedWildcardGameOver.videoUri) {
        ws.send(
          JSON.stringify({
            type: "scene_video",
            agent: "gm",
            sessionId,
            payload: {
              sceneKey: "wildcard_game_over",
              mediaId: "wildcard_game_over",
              triggerType: "hold_for_input",
              timeoutSeconds: 8,
              audioMode: "native_audio",
              url: preparedWildcardGameOver.videoUri,
            },
            timestamp: Date.now(),
          }),
        );
      }

      wildcardGameOverEndTimer = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "game_over" }));
        }
      }, 8_500);
    }, 700);
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
      await handleGmFunctionCall(
        sessionId,
        "triggerVideoGen",
        { sceneKey: "card1_pickup_pov" },
        ws,
        jasonManager,
      );
      setTimeout(() => {
        queueWildcardVisionPlayback();
      }, 6_500);
    })().catch((err: Error) => {
      console.error(
        `[WS] card1 pickup transition failed for session ${sessionId}:`,
        err.message,
      );
    });
  };

  const stopInteractionTimers = () => {
    if (npcIdleNudgeTimer) {
      clearInterval(npcIdleNudgeTimer);
      npcIdleNudgeTimer = null;
    }
    if (autoplayAdvanceTimer) {
      clearInterval(autoplayAdvanceTimer);
      autoplayAdvanceTimer = null;
    }
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

    autoplayAdvanceTimer = setInterval(() => {
      if (!jasonReadyForPlayer || ws.readyState !== WebSocket.OPEN) return;
      const secondsSilent = Math.floor(
        (Date.now() - lastPlayerSpeechAt) / 1000,
      );
      const holdTimeoutSeconds = getStepTimeoutSeconds(currentSequenceStep);
      if (secondsSilent < holdTimeoutSeconds) return;

      void (async () => {
        const fromStep = currentSequenceStep;
        // Step 31 is the terminal advance node — acecard keyword timer owns all progression from here.
        if (fromStep >= 31) return;
        const toStep = getNextAutoplayStep(fromStep);
        currentSequenceStep = toStep;
        lastPlayerSpeechAt = Date.now();

        ws.send(
          JSON.stringify({
            type: "autoplay_advance",
            payload: {
              fromStep,
              toStep,
              mediaId: STEP_MEDIA_TRIGGER[fromStep]?.mediaId ?? null,
              triggerType:
                STEP_MEDIA_TRIGGER[fromStep]?.triggerType ?? "hold_for_input",
              timeoutSeconds: holdTimeoutSeconds,
              reason: "timeout",
            },
          }),
        );

        if (!gmGated) return;
        const action = STEP_AUTOPLAY_ACTIONS[fromStep];
        if (!action) return;
        jasonManager.sendText(action.autoplayText);
        for (const call of action.gmCalls) {
          await handleGmFunctionCall(
            sessionId,
            call.fnName,
            call.args,
            ws,
            jasonManager,
          );
        }

        if (action.extra === "card1_auto_pick") {
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
          // Combined: card2_hunt_and_prewarm + hallway_pov_02_acecard.
          // NOTE: wildcard2 (game_over branch) is now frontend CSS/SFX only — prewarm
          // still runs for wildcard3 (good_ending) which may still use live gen.
          maybePrepareWildcardGameOver();
          maybePrepareWildcardGoodEnding();
          if (card2AutoPickTimer) {
            clearTimeout(card2AutoPickTimer);
            card2AutoPickTimer = null;
          }
          startAcecardKeywordTimer(
            acecardGateState,
            ws,
            sessionId,
            () => { void emitWildcardGameOverBranch(); },
          );
        }
      })().catch((err: Error) => {
        console.error(
          `[WS] autoplay advance failed for session ${sessionId}:`,
          err.message,
        );
      });
    }, 1_000);
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

      // GM session - silent, function calls only, no audio back to player
      const gmPrompt = getGameMasterSystemPrompt(sessionData.trustLevel);
      await gmManager.connect(gmPrompt, "gm");

      gmManager.onFunctionCall((id, name, args) => {
        // Gate scene/video events until the frontend sends intro_complete.
        // Prevents the GM from firing Beat 2 scene changes during Beat 1 darkness.
        if (
          !gmGated &&
          (name === "triggerSceneChange" || name === "triggerVideoGen")
        ) {
          console.log(`[GM] ${name} blocked pre-intro - session=${sessionId}`);
          gmManager.sendToolResponse(id, name);
          return;
        }
        // Track scene changes for B11 hint timer.
        if (name === "triggerSceneChange") sceneChangeCount++;
        // If acecard keyword timer is already running and the GM calls triggerDreadTimerStart,
        // treat it as a no-op — startAcecardKeywordTimer() already owns this timer slot at step 31.
        if (name === "triggerDreadTimerStart" && acecardGateState.acecardKeywordTimer !== null) {
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
        // Pre-warm image cache for the 3 opening zones while Jason speaks in darkness.
        prewarmImageCache(sessionId);
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
        jasonManager.sendAudio(data.audio);
        if (gmGated) gmManager.sendAudio(data.audio); // GM hears player only after intro_complete
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
        startAcecardKeywordTimer(
          acecardGateState,
          ws,
          sessionId,
          () => { void emitWildcardGameOverBranch(); },
        );
        return;
      }

      // Frontend signals the acecard_reveal_01.mp4 clip has finished playing.
      // Backend starts the 15s card_pickup_02 click window.
      if (data.type === "acecard_reveal_complete") {
        startCardPickup02Timer(
          acecardGateState,
          ws,
          sessionId,
          () => { void emitWildcardGameOverBranch(); },
        );
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
            if (data.cardId === "card1") queueWildcardVisionPlayback();
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
    if (hintTimer) clearTimeout(hintTimer);
    if (jasonReadyTimer) clearTimeout(jasonReadyTimer);
    stopInteractionTimers();
    clearCardAutoPickTimers();
    clearWildcardTimers();
    debugSessions.delete(sessionId);
    clearImageCache(sessionId);
    clearGlitchThrottle(sessionId);
    jasonManager.disconnect();
    audreyManager.disconnect();
    gmManager.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(
    `[SERVER] WebSocket & Express server running on ws://localhost:${PORT}`,
  );
  console.log(`[SERVER] Healthcheck at http://localhost:${PORT}/health`);
});
