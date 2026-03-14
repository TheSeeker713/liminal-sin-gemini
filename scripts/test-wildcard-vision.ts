/**
 * Wildcard1 (wildcard_vision_feed) pipeline smoke-test.
 *
 * Architecture (mirrors the actual game):
 *   1. Captures one fresh JPEG from the physical webcam (local, via ffmpeg)
 *   2. POSTs it to the deployed Cloud Run server at POST /debug/test-wildcard-vision
 *   3. The SERVER runs generateEditedSceneImage + generateSceneVideo using its
 *      own Vertex AI credentials (same path as a live player_frame WS message)
 *   4. Response includes: edited JPEG, video URI, timing, and any error detail
 *      that distinguishes server issues from Vertex AI / RAI blocks
 *
 * Usage:
 *   node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/test-wildcard-vision.ts
 *
 * Requires TEST_SERVER_URL in .env.local, e.g.:
 *   TEST_SERVER_URL=https://your-cloud-run-service.run.app
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WEBCAM_DEVICE = "UVC HD Camera";

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function prettyMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

async function main(): Promise<void> {
  const serverUrl = process.env.TEST_SERVER_URL?.replace(/\/$/, "");
  if (!serverUrl) {
    console.error("ERROR: TEST_SERVER_URL is not set in .env.local");
    console.error("  Add: TEST_SERVER_URL=https://your-cloud-run-service.run.app");
    process.exit(1);
  }

  const runId = nowStamp();
  const outputDir = join(process.cwd(), "scripts", "output", `tmp-wildcard-vision-${runId}`);
  mkdirSync(outputDir, { recursive: true });

  console.log("VISION_TEST_START", new Date().toISOString());
  console.log("SERVER_URL", serverUrl);
  console.log("OUTPUT_DIR", outputDir);

  // ── Step 0: Capture fresh webcam frame locally ───────────────────────────
  const rawFramePath = join(outputDir, "player_frame_raw.jpg");
  console.log(`\n[Step 0] Capturing fresh frame from "${WEBCAM_DEVICE}"...`);
  execSync(
    `ffmpeg -y -f dshow -i video="${WEBCAM_DEVICE}" -vframes 1 -q:v 2 "${rawFramePath}"`,
    { stdio: "pipe" },
  );
  const frameBase64 = require("node:fs").readFileSync(rawFramePath).toString("base64");
  console.log(`[Step 0] Frame captured (${Math.round(frameBase64.length / 1024)}KB base64)`);

  // ── Step 1+2: POST to cloud server — Imagen edit + Veo on cloud ──────────
  console.log(`\n[Step 1+2] Sending to server: ${serverUrl}/debug/test-wildcard-vision`);
  console.log("         Server will run: generateEditedSceneImage → generateSceneVideo");
  const postStart = Date.now();

  let responseBody: Record<string, unknown>;
  try {
    const response = await fetch(`${serverUrl}/debug/test-wildcard-vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jpeg: frameBase64 }),
      signal: AbortSignal.timeout(300_000),
    });
    responseBody = await response.json() as Record<string, unknown>;
  } catch (err) {
    console.error("FAIL: Could not reach server:", String(err));
    process.exit(1);
  }

  const totalMs = Date.now() - postStart;
  console.log(`[Step 1+2] Server responded in ${prettyMs(totalMs)}`);

  // ── Parse and report results ─────────────────────────────────────────────
  const steps = responseBody.steps as Record<string, Record<string, unknown>> | undefined;
  const editStep = steps?.imagenEdit;
  const videoStep = steps?.veoVideo;

  console.log("\n── IMAGEN EDIT ──────────────────────────────────────────────");
  console.log(`  success   : ${editStep?.success}`);
  console.log(`  duration  : ${prettyMs(Number(editStep?.durationMs ?? 0))}`);
  if (editStep?.error) console.error(`  ERROR     : ${editStep.error}`);

  console.log("\n── VEO VIDEO ────────────────────────────────────────────────");
  console.log(`  success   : ${videoStep?.success}`);
  console.log(`  duration  : ${prettyMs(Number(videoStep?.durationMs ?? 0))}`);
  if (videoStep?.error) console.error(`  ERROR     : ${videoStep.error}`);

  // Save outputs
  if (editStep?.imageBytes) {
    const editedPath = join(outputDir, "wildcard_vision_feed_edited.jpg");
    writeFileSync(editedPath, Buffer.from(editStep.imageBytes as string, "base64"));
    console.log(`\n[Saved] Edited image → ${editedPath}`);
  }

  if (videoStep?.videoUri) {
    const videoPath = join(outputDir, "wildcard_vision_feed.mp4");
    const uri = videoStep.videoUri as string;
    if (uri.startsWith("data:")) {
      writeFileSync(videoPath, Buffer.from(uri.split(",")[1], "base64"));
    } else {
      const dl = await fetch(uri);
      writeFileSync(videoPath, Buffer.from(await dl.arrayBuffer()));
    }
    console.log(`[Saved] Video        → ${videoPath}`);
  }

  // Save full server response for diagnostics
  writeFileSync(join(outputDir, "server_response.json"), JSON.stringify(responseBody, null, 2));

  const passed = responseBody.ok === true;
  console.log(`\nSTATUS: ${passed ? "PASS" : "FAIL"}`);
  if (!passed) process.exit(2);
}

void main().catch((err: Error) => {
  console.error("VISION_TEST_EXCEPTION", err.message);
  process.exit(1);
});
