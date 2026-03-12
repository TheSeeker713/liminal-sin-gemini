import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateSceneImage } from "../server/services/imagen";
import { getVeoAiClient } from "../server/services/gemini";

type SceneResult = {
  sceneKey: string;
  imageTime: string;
  videoTime: string;
  sceneTotal: string;
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
    "Slow cinematic camera drift through the tunnel with subtle LED flicker and dust motes.",
  zone_tunnel_mid:
    "Slow dolly forward with soft haze and subtle floor texture movement.",
  zone_merge:
    "Slow pass through a fractured concrete threshold with gentle atmospheric drift.",
  zone_park_shore:
    "Slow panoramic sweep across flooded underground waterpark architecture with reflective water.",
  zone_park_shallow:
    "First-person wading motion with gentle water ripples and warm reflected light.",
  zone_park_slides:
    "Slow upward tilt over large slide structures with subtle ambient light flicker.",
  zone_park_deep:
    "Slow forward lean over deeper water with calm surface ripples and reflected light columns.",
  slotsky_card:
    "Slow move toward cards on wet floor with subtle shifting shadows and still water.",
  flashlight_beam:
    "Controlled flashlight sweep left and right through darkness, droplets briefly illuminated.",
  generator_area:
    "Slow tilt from generator body to card at base, subtle mechanical vibration in frame.",
  maintenance_area:
    "Exploratory flashlight scan across pipes and concrete with brief pauses and return swing.",
  card2_closeup:
    "Steady close framing on card in hand with very subtle natural light shift.",
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

function makeVideoPrompt(sceneKey: string): string {
  const hint =
    VIDEO_HINTS[sceneKey] ?? "Slow atmospheric first-person camera movement.";
  return `First-person POV underground cinematic exploration. ${hint} Photorealistic, high detail, no people, no faces, no text, no logos.`;
}

async function generateSceneVideoVariant(
  sceneKey: string,
  base64Jpeg: string,
  outDir: string,
): Promise<
  | { ok: true; videoTimeMs: number; videoPath?: string; videoUri?: string }
  | { ok: false; reason: string; videoTimeMs: number }
> {
  const videoStart = Date.now();

  try {
    const opInit = await getVeoAiClient().models.generateVideos({
      model: "veo-3.1-fast-generate-001",
      image: {
        imageBytes: base64Jpeg,
        mimeType: "image/jpeg",
      },
      config: {
        numberOfVideos: 1,
        durationSeconds: 6,
        fps: 24,
        aspectRatio: "16:9",
        personGeneration: "dont_allow",
        enhancePrompt: true,
        negativePrompt:
          "people, faces, text, watermark, logo, blood, gore, weapon, blurry, low quality",
      },
      prompt: makeVideoPrompt(sceneKey),
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
      return {
        ok: false,
        reason: `POLICY_VIOLATION: RAI filtered output (${operation.response?.raiMediaFilteredCount}) ${JSON.stringify(operation.response?.raiMediaFilteredReasons ?? [])}`,
        videoTimeMs: Date.now() - videoStart,
      };
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    const uri = video?.uri;
    const bytes = video?.videoBytes;

    if (uri) {
      return {
        ok: true,
        videoUri: uri,
        videoTimeMs: Date.now() - videoStart,
      };
    }

    if (bytes) {
      const outPath = join(outDir, `${sceneKey}.mp4`);
      writeFileSync(outPath, Buffer.from(bytes, "base64"));
      return {
        ok: true,
        videoPath: outPath,
        videoTimeMs: Date.now() - videoStart,
      };
    }

    return {
      ok: false,
      reason: "CRITICAL: Veo completed but returned no URI or inline bytes",
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

  log("PIPELINE_BENCHMARK_START");
  log(`RUN_ID=${runId}`);
  log(`SCENE_COUNT=${SCENE_KEYS.length}`);

  for (let i = 0; i < SCENE_KEYS.length; i += 1) {
    const sceneKey = SCENE_KEYS[i];
    const sceneStart = Date.now();

    log(`SCENE_START=${sceneKey} INDEX=${i + 1}/${SCENE_KEYS.length}`);

    const imageStart = Date.now();
    const base64Jpeg = await generateSceneImage(sceneKey);
    const imageTimeMs = Date.now() - imageStart;
    const imageTime = toHHMMSS(imageTimeMs);

    if (!base64Jpeg) {
      const failure = "CRITICAL: Imagen returned null image";
      const sceneTotal = toHHMMSS(Date.now() - sceneStart);
      results.push({
        sceneKey,
        imageTime,
        videoTime: "00:00:00",
        sceneTotal,
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

    const imagePath = join(imageOut, `${sceneKey}.jpg`);
    writeFileSync(imagePath, Buffer.from(base64Jpeg, "base64"));
    log(`IMAGE_TIMER=${imageTime}`);

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
        imageTime,
        videoTime,
        sceneTotal,
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

    results.push({
      sceneKey,
      imageTime,
      videoTime,
      sceneTotal,
      imagePath,
      videoPath: videoResult.videoPath,
      videoUri: videoResult.videoUri,
      status: "ok",
    });

    log(`VIDEO_TIMER=${videoTime}`);
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
