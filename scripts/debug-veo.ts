import { getVeoAiClient } from "../server/services/gemini";
import { generateSceneImage } from "../server/services/imagen";

(async () => {
  const sceneKey = "flashlight_beam";
  const img = await generateSceneImage(sceneKey);
  if (!img) {
    console.error("no image");
    process.exit(1);
  }
  console.log("image ok, bytes=", img.length);

  let op = await getVeoAiClient().models.generateVideos({
    model: "veo-3.1-fast-generate-001",
    image: { imageBytes: img, mimeType: "image/jpeg" },
    config: {
      numberOfVideos: 1,
      durationSeconds: 6,
      fps: 24,
      aspectRatio: "16:9",
      personGeneration: "dont_allow",
      negativePrompt: "people, faces, hands, text, watermark",
      enhancePrompt: true,
    },
    prompt:
      "First-person POV underground cinematic exploration. Flashlight beam sweeps slowly left then right through darkness. Cinematic, photorealistic.",
  });

  console.log("initial op done=", op.done, "name=", op.name);
  const start = Date.now();
  while (!op.done) {
    if (Date.now() - start > 120_000) {
      console.error("timeout");
      process.exit(2);
    }
    await new Promise((r) => setTimeout(r, 10_000));
    op = await getVeoAiClient().operations.getVideosOperation({
      operation: op,
    });
    console.log("polled: done=", op.done, "error=", JSON.stringify(op.error));
  }

  console.log("FULL RESPONSE JSON:", JSON.stringify(op.response, null, 2));
  console.log(
    "FULL OP:",
    JSON.stringify({ done: op.done, error: op.error, name: op.name }, null, 2),
  );
  process.exit(0);
})().catch((e) => {
  console.error("EXCEPTION", (e as Error)?.message || e);
  process.exit(3);
});
