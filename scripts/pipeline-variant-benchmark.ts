import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateSceneImageWithMeta } from "../server/services/imagen";
import { getVeoAiClient } from "../server/services/gemini";
import { NEGATIVES } from "../server/services/mediaSafety";
import { extractLastFrame } from "./frameExtract";

type SceneResult = {
  sceneKey: string;
  imageSource: "imagen" | "chained_last_frame";
  imageTime: string;
  videoTime: string;
  sceneTotal: string;
  imageSeed: number | null;
  videoSeed: number | null;
  imagePath?: string;
  videoPath?: string;
  videoUri?: string;
  status: "ok" | "failed";
  failureReason?: string;
};

const SCENE_KEYS = [
  "zone_tunnel_entry",
  "zone_tunnel_mid",
  "zone_merge",
  "zone_park_shore",
  "zone_park_shallow",
  "zone_park_slides",
  "zone_park_deep",
  "slotsky_card",
  "flashlight_beam",
  "generator_area",
  "maintenance_area",
  "card2_closeup",
] as const;

const VIDEO_HINTS: Record<string, string> = {
  zone_tunnel_entry:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, advancing through unfinished tunnel with intermittent LED flicker and drifting dust",
  zone_tunnel_mid:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, slow advance into deeper tunnel with low haze and converging floor texture",
  zone_merge:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, careful forward pass through fractured concrete threshold with ambient particulate drift",
  zone_park_shore:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, cautious scan over flooded underground water-park shoreline with mirrorlike reflections",
  zone_park_shallow:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, shallow water traversal with concentric ripples and warm reflected light",
  zone_park_slides:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, upward inspection of aging slide structures under unstable ambient light",
  zone_park_deep:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, deliberate lean over deep still water with slow reflected light columns",
  slotsky_card:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, controlled approach toward cards on wet floor with shifting hard-edged shadows",
  flashlight_beam:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, deliberate flashlight sweep left to right through darkness with droplets briefly lit",
  generator_area:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, measured tilt from generator housing to card at base with mild frame vibration",
  maintenance_area:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, exploratory flashlight scan across conduit and concrete with short investigative pauses",
  card2_closeup:
    "point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement, close inspection framing on queen of spades with restrained illumination drift",
};

const logs: string[] = [];
const results: SceneResult[] = [];

function toHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function log(line: string): void {
  console.log(line);
  logs.push(line);
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function makeVideoPrompt(
  sceneKey: string,
  mode: "primary" | "safety_retry" | "minimal",
): string {
  const hint =
    VIDEO_HINTS[sceneKey] ?? "Slow atmospheric first-person camera movement.";
  if (mode === "primary") {
    return `First-person POV underground cinematic exploration. ${hint}. Forward gaze lock. No visible body parts, no silhouette, no reflection of a person, no hands unless intentionally scripted. Photorealistic, high detail, documentary-smartglasses style.`;
  }

  if (mode === "safety_retry") {
    return `Environmental camera recording in abandoned underground structures. ${hint}. Empty environment only. No people, no faces, no body parts, no silhouettes, no reflections of any person, no hands, no human presence. Photorealistic scene continuity, stable image semantics.`;
  }

  return `Environmental camera recording, empty underground architecture only. ${hint}. Scene-only motion, no person depiction in any form, no human anatomy, no mirrors showing humans. Photorealistic continuity.`;
}

function readNumericSeed(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function generateSceneVideoVariant(
  sceneKey: string,
  base64Jpeg: string,
  outDir: string,
): Promise<
  | {
      ok: true;
      videoTimeMs: number;
      videoPath?: string;
      videoUri?: string;
      videoSeed: number | null;
    }
  | { ok: false; reason: string; videoTimeMs: number }
> {
  const videoStart = Date.now();
  const baseVeoConfig = {
    numberOfVideos: 1,
    durationSeconds: 6,
    fps: 24,
    aspectRatio: "16:9",
    personGeneration: "ALLOW_ADULT",
    enhancePrompt: true,
    negativePrompt: NEGATIVES,
    safetyFilterLevel: "BLOCK_ONLY_HIGH",
    addWatermark: false,
  };

  try {
    const attempts: Array<{
      label: string;
      promptMode: "primary" | "safety_retry" | "minimal";
    }> = [
      { label: "PRIMARY", promptMode: "primary" },
      { label: "SAFETY_RETRY", promptMode: "safety_retry" },
      { label: "MINIMAL", promptMode: "minimal" },
    ];

    for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
      const attempt = attempts[attemptIndex];
      const prompt = makeVideoPrompt(sceneKey, attempt.promptMode);

      console.warn(
        `[BENCHMARK] Video attempt ${attemptIndex + 1}/${attempts.length} for ${sceneKey} mode=${attempt.label}`,
      );

      const opInit = await getVeoAiClient().models.generateVideos({
        model: "veo-3.1-fast-generate-001",
        image: {
          imageBytes: base64Jpeg,
          mimeType: "image/jpeg",
        },
        config: baseVeoConfig as never,
        prompt,
      });

      let operation = opInit;
      const pollStarted = Date.now();
      while (operation.done !== true) {
        if (Date.now() - pollStarted > 180_000) {
          return {
            ok: false,
            reason: "CRITICAL: Veo operation timeout",
            videoTimeMs: Date.now() - videoStart,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        operation = await getVeoAiClient().operations.getVideosOperation({
          operation,
        });
      }

      if (operation.error) {
        return {
          ok: false,
          reason: `CRITICAL: Veo operation error ${JSON.stringify(operation.error)}`,
          videoTimeMs: Date.now() - videoStart,
        };
      }

      if ((operation.response?.raiMediaFilteredCount ?? 0) > 0) {
        const reason = `POLICY_VIOLATION: RAI filtered output (${operation.response?.raiMediaFilteredCount}) ${JSON.stringify(operation.response?.raiMediaFilteredReasons ?? [])}`;
        if (attemptIndex < attempts.length - 1) {
          console.warn(
            `[BENCHMARK] ${sceneKey} retrying after policy block. attempt=${attempt.label} reason=${reason}`,
          );
          continue;
        }
        return {
          ok: false,
          reason,
          videoTimeMs: Date.now() - videoStart,
        };
      }

      const video = operation.response?.generatedVideos?.[0]?.video;
      const generatedVideo = operation.response?.generatedVideos?.[0] as
        | { seed?: unknown; video?: { seed?: unknown } }
        | undefined;
      const videoSeed =
        readNumericSeed(generatedVideo?.seed) ??
        readNumericSeed(generatedVideo?.video?.seed) ??
        readNumericSeed((operation.response as { seed?: unknown } | undefined)?.seed) ??
        readNumericSeed((operation as { seed?: unknown }).seed);
      const uri = video?.uri;
      const bytes = video?.videoBytes;

      if (uri) {
        return {
          ok: true,
          videoUri: uri,
          videoTimeMs: Date.now() - videoStart,
          videoSeed,
        };
      }

      if (bytes) {
        const outPath = join(outDir, `${sceneKey}.mp4`);
        writeFileSync(outPath, Buffer.from(bytes, "base64"));
        return {
          ok: true,
          videoPath: outPath,
          videoTimeMs: Date.now() - videoStart,
          videoSeed,
        };
      }

      return {
        ok: false,
        reason: "CRITICAL: Veo completed but returned no URI or inline bytes",
        videoTimeMs: Date.now() - videoStart,
      };
    }

    return {
      ok: false,
      reason: "CRITICAL: Veo attempts exhausted without terminal response",
      videoTimeMs: Date.now() - videoStart,
    };
  } catch (err) {
    return {
      ok: false,
      reason: `CRITICAL: Veo exception ${(err as Error).message}`,
      videoTimeMs: Date.now() - videoStart,
    };
  }
}

async function run(): Promise<void> {
  const runId = nowStamp();
  const outRoot = join(
    process.cwd(),
    "scripts",
    "output",
    `pipeline-benchmark-${runId}`,
  );
  const imageOut = join(outRoot, "images");
  const videoOut = join(outRoot, "videos");
  mkdirSync(imageOut, { recursive: true });
  mkdirSync(videoOut, { recursive: true });

  const productionStart = Date.now();
  let stoppedEarly = false;
  let stopReason = "";
  let chainedReferenceBase64: string | null = null;

  log("PIPELINE_BENCHMARK_START");
  log(`RUN_ID=${runId}`);
  log(`SCENE_COUNT=${SCENE_KEYS.length}`);

  for (let i = 0; i < SCENE_KEYS.length; i += 1) {
    const sceneKey = SCENE_KEYS[i];
    const sceneStart = Date.now();
    const imageSource = i === 0 ? "imagen" : "chained_last_frame";

    log(`SCENE_START=${sceneKey} INDEX=${i + 1}/${SCENE_KEYS.length}`);

    let base64Jpeg: string | null = null;
    let imageSeed: number | null = null;
    let imagePath: string | undefined;
    let imageTimeMs = 0;

    if (i === 0) {
      const imageStart = Date.now();
      const imageResult = await generateSceneImageWithMeta(sceneKey);
      imageTimeMs = Date.now() - imageStart;

      if (!imageResult) {
        const failure = "CRITICAL: Imagen returned null image";
        const sceneTotal = toHHMMSS(Date.now() - sceneStart);
        results.push({
          sceneKey,
          imageSource,
          imageTime: toHHMMSS(imageTimeMs),
          videoTime: "00:00:00",
          sceneTotal,
          imageSeed,
          videoSeed: null,
          status: "failed",
          failureReason: failure,
        });
        log(`IMAGE_TIMER=${toHHMMSS(imageTimeMs)}`);
        log("VIDEO_TIMER=00:00:00");
        log(`SCENE_TOTAL=${sceneTotal}`);
        log(`STOP_REASON=${failure}`);
        stoppedEarly = true;
        stopReason = failure;
        break;
      }

      base64Jpeg = imageResult.imageBytes;
      imageSeed = imageResult.seed;
      imagePath = join(imageOut, `${sceneKey}.jpg`);
      writeFileSync(imagePath, Buffer.from(base64Jpeg, "base64"));
    } else {
      if (!chainedReferenceBase64) {
        const failure =
          "CRITICAL: Chained pipeline missing previous last-frame reference";
        const sceneTotal = toHHMMSS(Date.now() - sceneStart);
        results.push({
          sceneKey,
          imageSource,
          imageTime: "00:00:00",
          videoTime: "00:00:00",
          sceneTotal,
          imageSeed,
          videoSeed: null,
          status: "failed",
          failureReason: failure,
        });
        log("IMAGE_TIMER=00:00:00");
        log("VIDEO_TIMER=00:00:00");
        log(`SCENE_TOTAL=${sceneTotal}`);
        log(`STOP_REASON=${failure}`);
        stoppedEarly = true;
        stopReason = failure;
        break;
      }

      base64Jpeg = chainedReferenceBase64;
      imagePath = join(imageOut, `${sceneKey}.ref.jpg`);
      writeFileSync(imagePath, Buffer.from(base64Jpeg, "base64"));
    }

    const imageTime = toHHMMSS(imageTimeMs);
    if (!base64Jpeg) {
      const failure = "CRITICAL: Missing image reference for video generation";
      const sceneTotal = toHHMMSS(Date.now() - sceneStart);
      results.push({
        sceneKey,
        imageSource,
        imageTime,
        videoTime: "00:00:00",
        sceneTotal,
        imageSeed,
        videoSeed: null,
        status: "failed",
        failureReason: failure,
      });
      log(`IMAGE_TIMER=${imageTime}`);
      log(`VIDEO_TIMER=00:00:00`);
      log(`SCENE_TOTAL=${sceneTotal}`);
      log(`STOP_REASON=${failure}`);
      stoppedEarly = true;
      stopReason = failure;
      break;
    }

    if (imageSource === "chained_last_frame") {
      log("IMAGE_SOURCE=chained_last_frame");
    }
    log(`IMAGE_TIMER=${imageTime}`);
    log(`IMAGE_SEED=${imageSeed ?? "unknown"}`);

    const videoResult = await generateSceneVideoVariant(
      sceneKey,
      base64Jpeg,
      videoOut,
    );
    const videoTime = toHHMMSS(videoResult.videoTimeMs);
    const sceneTotal = toHHMMSS(Date.now() - sceneStart);

    if (!videoResult.ok) {
      const failedVideo = videoResult as {
        ok: false;
        reason: string;
        videoTimeMs: number;
      };
      results.push({
        sceneKey,
        imageSource,
        imageTime,
        videoTime,
        sceneTotal,
        imageSeed,
        videoSeed: null,
        imagePath,
        status: "failed",
        failureReason: failedVideo.reason,
      });
      log(`VIDEO_TIMER=${videoTime}`);
      log(`SCENE_TOTAL=${sceneTotal}`);
      log(`STOP_REASON=${failedVideo.reason}`);
      stoppedEarly = true;
      stopReason = failedVideo.reason;
      break;
    }

    let nextReferenceBase64: string | null = null;
    if (videoResult.videoPath) {
      try {
        const frame = await extractLastFrame(videoResult.videoPath);
        nextReferenceBase64 = frame.toString("base64");
        const framePath = join(imageOut, `${sceneKey}.last-frame.jpg`);
        writeFileSync(framePath, frame);
        log(`LAST_FRAME_FILE=${framePath}`);
      } catch (err) {
        const failure = `CRITICAL: Last-frame extraction failed ${(err as Error).message}`;
        results.push({
          sceneKey,
          imageSource,
          imageTime,
          videoTime,
          sceneTotal,
          imageSeed,
          videoSeed: videoResult.videoSeed,
          imagePath,
          videoPath: videoResult.videoPath,
          videoUri: videoResult.videoUri,
          status: "failed",
          failureReason: failure,
        });
        log(`VIDEO_TIMER=${videoTime}`);
        log(`SCENE_TOTAL=${sceneTotal}`);
        log(`STOP_REASON=${failure}`);
        stoppedEarly = true;
        stopReason = failure;
        break;
      }
    } else if (i < SCENE_KEYS.length - 1) {
      const failure =
        "CRITICAL: Chained pipeline requires local video file for last-frame extraction";
      results.push({
        sceneKey,
        imageSource,
        imageTime,
        videoTime,
        sceneTotal,
        imageSeed,
        videoSeed: videoResult.videoSeed,
        imagePath,
        videoPath: videoResult.videoPath,
        videoUri: videoResult.videoUri,
        status: "failed",
        failureReason: failure,
      });
      log(`VIDEO_TIMER=${videoTime}`);
      log(`SCENE_TOTAL=${sceneTotal}`);
      log(`STOP_REASON=${failure}`);
      stoppedEarly = true;
      stopReason = failure;
      break;
    }

    results.push({
      sceneKey,
      imageSource,
      imageTime,
      videoTime,
      sceneTotal,
      imageSeed,
      videoSeed: videoResult.videoSeed,
      imagePath,
      videoPath: videoResult.videoPath,
      videoUri: videoResult.videoUri,
      status: "ok",
    });

    chainedReferenceBase64 = nextReferenceBase64;
    log(`VIDEO_TIMER=${videoTime}`);
    log(`VIDEO_SEED=${videoResult.videoSeed ?? "unknown"}`);
    log(`SCENE_TOTAL=${sceneTotal}`);
    if (videoResult.videoPath) log(`VIDEO_FILE=${videoResult.videoPath}`);
    if (videoResult.videoUri) log(`VIDEO_URI=${videoResult.videoUri}`);
  }

  const productionTotal = toHHMMSS(Date.now() - productionStart);
  log(`PRODUCTION_TOTAL=${productionTotal}`);
  log(`STATUS=${stoppedEarly ? "STOPPED_EARLY" : "COMPLETED"}`);
  if (stoppedEarly) log(`FINAL_STOP_REASON=${stopReason}`);

  const logPath = join(outRoot, "benchmark.log");
  const jsonPath = join(outRoot, "benchmark.json");

  writeFileSync(logPath, `${logs.join("\n")}\n`, "utf8");
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        runId,
        productionTotal,
        status: stoppedEarly ? "STOPPED_EARLY" : "COMPLETED",
        stopReason: stoppedEarly ? stopReason : null,
        results,
      },
      null,
      2,
    ),
    "utf8",
  );

  log(`LOG_FILE=${logPath}`);
  log(`JSON_FILE=${jsonPath}`);

  if (stoppedEarly) process.exit(2);
}

run().catch((err) => {
  console.error("CRITICAL: Benchmark script exception", (err as Error).message);
  process.exit(99);
});
