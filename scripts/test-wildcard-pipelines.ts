import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateSceneImageWithMeta } from "../server/services/imagen";
import { generateSceneVideo } from "../server/services/veo";

type WildcardCase = "wildcard_game_over" | "wildcard_good_ending";

type CaseResult = {
  sceneKey: WildcardCase;
  imageGenerated: boolean;
  videoGenerated: boolean;
  imageSeed: number | null;
  videoUri: string | null;
  imagePath: string | null;
  videoPath: string | null;
  imageDurationMs: number;
  videoDurationMs: number;
  status: "PASS" | "FAIL";
  failureReason?: string;
  videoResponseNote?: string;
};

type Scorecard = {
  runId: string;
  outputDir: string;
  startedAt: string;
  finishedAt: string;
  totals: {
    total: number;
    passed: number;
    failed: number;
    passRatePercent: number;
  };
  results: CaseResult[];
};

const CASES: WildcardCase[] = ["wildcard_game_over", "wildcard_good_ending"];

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function prettyMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

async function downloadToFile(uri: string, outPath: string): Promise<void> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(
      `download failed ${response.status} ${response.statusText} for ${uri}`,
    );
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(outPath, bytes);
}

async function runCase(sceneKey: WildcardCase, outDir: string): Promise<CaseResult> {
  const imageStarted = Date.now();
  const imageResult = await generateSceneImageWithMeta(sceneKey);
  const imageDurationMs = Date.now() - imageStarted;

  if (!imageResult) {
    return {
      sceneKey,
      imageGenerated: false,
      videoGenerated: false,
      imageSeed: null,
      videoUri: null,
      imagePath: null,
      videoPath: null,
      imageDurationMs,
      videoDurationMs: 0,
      status: "FAIL",
      failureReason: "image generation returned null",
    };
  }

  const imagePath = join(outDir, `${sceneKey}.jpg`);
  writeFileSync(imagePath, Buffer.from(imageResult.imageBytes, "base64"));

  // Image-to-video: feed Imagen still into Veo as reference image (matches server pipeline)
  const videoStarted = Date.now();
  const videoPath = join(outDir, `${sceneKey}.mp4`);
  const videoUri = await generateSceneVideo(sceneKey, imageResult.imageBytes);
  const videoDurationMs = Date.now() - videoStarted;

  if (!videoUri) {
    return {
      sceneKey,
      imageGenerated: true,
      videoGenerated: false,
      imageSeed: imageResult.seed,
      videoUri: null,
      imagePath,
      videoPath: null,
      imageDurationMs,
      videoDurationMs,
      status: "FAIL",
      failureReason: "generateSceneVideo returned null (image-to-video)",
    };
  }

  // Save video — handle both GCS URI (HTTP download) and data URI (inline base64)
  if (videoUri.startsWith("data:")) {
    const base64 = videoUri.split(",")[1];
    writeFileSync(videoPath, Buffer.from(base64, "base64"));
  } else {
    await downloadToFile(videoUri, videoPath);
  }

  return {
    sceneKey,
    imageGenerated: true,
    videoGenerated: true,
    imageSeed: imageResult.seed,
    videoUri,
    imagePath,
    videoPath,
    imageDurationMs,
    videoDurationMs,
    status: "PASS",
    videoResponseNote: "image-to-video via generateSceneVideo",
  };
}

async function main(): Promise<void> {
  const runId = nowStamp();
  const outputDir = join(process.cwd(), "scripts", "output", `tmp-wildcard-test-${runId}`);
  mkdirSync(outputDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const results: CaseResult[] = [];

  console.log("WILDCARD_TEST_START", startedAt);
  console.log("OUTPUT_DIR", outputDir);

  for (const sceneKey of CASES) {
    console.log(`CASE_START ${sceneKey}`);
    const result = await runCase(sceneKey, outputDir);
    results.push(result);
    console.log(
      `CASE_RESULT ${sceneKey} status=${result.status} image=${prettyMs(result.imageDurationMs)} video=${prettyMs(result.videoDurationMs)}`,
    );
    if (result.failureReason) {
      console.log(`CASE_FAILURE ${sceneKey} reason=${result.failureReason}`);
    }
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.length - passed;

  const scorecard: Scorecard = {
    runId,
    outputDir,
    startedAt,
    finishedAt: new Date().toISOString(),
    totals: {
      total: results.length,
      passed,
      failed,
      passRatePercent: Number(((passed / results.length) * 100).toFixed(2)),
    },
    results,
  };

  const scorecardPath = join(outputDir, "scorecard.json");
  writeFileSync(scorecardPath, JSON.stringify(scorecard, null, 2));

  console.log("WILDCARD_TEST_DONE");
  console.log(`SCORE total=${scorecard.totals.total} passed=${passed} failed=${failed} passRate=${scorecard.totals.passRatePercent}%`);
  console.log(`SCORECARD_PATH ${scorecardPath}`);

  if (failed > 0) {
    process.exit(2);
  }
}

void main().catch((err: Error) => {
  console.error("WILDCARD_TEST_EXCEPTION", err.message);
  process.exit(1);
});
