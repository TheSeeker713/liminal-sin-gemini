import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getVeoAiClient } from "../server/services/gemini";

(async () => {
  const prompt =
    "Cinematic first-person exploration of a beautiful abandoned underground waterpark, atmospheric volumetric lighting, shimmering reflections on shallow water, slow deliberate camera movement, ultra-detailed, filmic color grading, serene mood, no people, no faces, no text, no logos.";

  console.log("[VANILLA_VEO] model=veo-3.1-fast-generate-001");
  console.log("[VANILLA_VEO] prompt=", prompt);

  let op = await getVeoAiClient().models.generateVideos({
    model: "veo-3.1-fast-generate-001",
    prompt,
    config: {
      numberOfVideos: 1,
      durationSeconds: 6,
      fps: 24,
      aspectRatio: "16:9",
      personGeneration: "dont_allow",
      enhancePrompt: true,
      negativePrompt:
        "people, faces, text, watermark, logo, blood, gore, weapon",
    },
  });

  const started = Date.now();
  while (op.done !== true) {
    if (Date.now() - started > 180_000) {
      console.error("[VANILLA_VEO] TIMEOUT waiting for completion");
      process.exit(2);
    }
    await new Promise((r) => setTimeout(r, 10_000));
    op = await getVeoAiClient().operations.getVideosOperation({
      operation: op,
    });
    console.log("[VANILLA_VEO] polling done=", op.done === true);
  }

  const generated = op.response?.generatedVideos?.[0]?.video;
  const uri = generated?.uri;
  const inline = generated?.videoBytes;
  const inlineLen = inline ? inline.length : 0;

  if (uri) {
    console.log("[VANILLA_VEO] SUCCESS uri=", uri);
    process.exit(0);
  }

  if (inlineLen > 0) {
    const outDir = join(process.cwd(), "scripts", "output");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `vanilla-veo-${Date.now()}.mp4`);
    writeFileSync(outPath, Buffer.from(inline, "base64"));
    console.log("[VANILLA_VEO] SUCCESS inline_video_bytes=", inlineLen);
    console.log("[VANILLA_VEO] SAVED_FILE=", outPath);
    process.exit(0);
  }

  if ((op.response?.raiMediaFilteredCount ?? 0) > 0) {
    console.error(
      "[VANILLA_VEO] RAI_FILTERED count=",
      op.response?.raiMediaFilteredCount,
    );
    console.error(
      "[VANILLA_VEO] reasons=",
      JSON.stringify(op.response?.raiMediaFilteredReasons ?? [], null, 2),
    );
    process.exit(3);
  }

  console.error(
    "[VANILLA_VEO] NO_VIDEO_PAYLOAD response=",
    JSON.stringify(op.response ?? {}, null, 2),
  );
  process.exit(4);
})().catch((e) => {
  console.error("[VANILLA_VEO] EXCEPTION", (e as Error)?.message || e);
  process.exit(5);
});
