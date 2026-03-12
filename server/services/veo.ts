import type { GenerateVideosOperation } from "@google/genai";
import { getVeoAiClient } from "./gemini";
import { NEGATIVES } from "./mediaSafety";

/**
 * Generates a short video clip from a reference still image via Veo 3.1 Fast.
 * Takes the Imagen 4 base64 JPEG + the original scene prompt, returns a GCS URI
 * (or null on failure). This is an async long-running operation — the caller
 * should fire-and-forget and broadcast the result when it arrives.
 *
 * NEVER use Veo 2. Always use Veo 3.1 Fast.
 */

/** Animation prompt suffixes keyed by zone — keeps video motion lore-consistent. */
const ANIMATION_HINTS: Record<string, string> = {
  flashlight_beam:
    "Flashlight beam sweeps slowly left then right through total darkness, catching suspended water droplets as it moves — each droplet briefly lit then returns to black — no environment fills in except what the beam directly touches, beam completes one full survey sweep and returns to center pointing forward, holds steady",

  generator_area:
    "Flashlight beam sweeps across the industrial generator housing and settles on the starting mechanism — a gloved hand enters frame to actuate the generator switch, the machine shudders and vibrates to life, beam then drifts slowly downward to the concrete floor at the generator base where a joker playing card lies face-up, perfectly placed, camera holds on the card",

  park_entrance:
    "Camera drifts slowly forward through the broken concrete threshold — concrete rubble at the tunnel edge gives way to tropical warmth, pool surface shimmers with reflected neon, a working slide in background lightly mists the air below its exit chute, tropical palms sway almost imperceptibly, the transition from dark industrial concrete behind to vivid living color ahead fills the frame as camera advances",

  park_walkway:
    "Slow walking-pace forward camera movement along the promenade, slight natural sway from footsteps, looking ahead and gently upward at the massive curved slides, panning right to reveal the lazy river channel and its moving water, then back ahead as the cascading waterfall fills the far frame with shimmering spray-light, park scale revealed over six seconds of motion, subtle mist drifts near the waterfall",

  maintenance_area:
    "Rapid exploratory scan, flashlight sweeps left to right across pipes and conduit, beam pauses briefly on darker alcoves, then swings back to the aquamarine-glowing park doorway in the background — the neon glow through the arch flickers once — then flashlight swings forward",
};

/** Resolve a motion-description suffix for a given sceneKey. */
function resolveAnimationHint(sceneKey: string): string {
  const key = sceneKey.toLowerCase();
  for (const zoneId of Object.keys(ANIMATION_HINTS)) {
    if (key.includes(zoneId)) return ANIMATION_HINTS[zoneId];
  }
  // Keyword fallbacks
  if (key.includes("park") || key.includes("shore") || key.includes("shallow") || key.includes("slide") || key.includes("deep"))
    return ANIMATION_HINTS["park_walkway"];
  if (key.includes("maintenance") || key.includes("card") || key.includes("slotsky"))
    return ANIMATION_HINTS["maintenance_area"];
  if (key.includes("generator"))
    return ANIMATION_HINTS["generator_area"];
  return ANIMATION_HINTS["flashlight_beam"];
}

/** Maximum time to poll before giving up (ms). */
const MAX_POLL_MS = 120_000;
/** Interval between polls (ms). */
const POLL_INTERVAL_MS = 10_000;

/**
 * Veo model candidates in priority order.
 * - VEO_MODEL env var can force one model (first in list).
 * - Keep Veo2 excluded per project rule.
 */
function getVeoModelCandidates(): string[] {
  const configured = process.env.VEO_MODEL?.trim();
  const defaults = [
    "veo-3.1-fast-generate-001",
    "veo-3.0-fast-generate-001",
    "veo-3.0-generate-001",
  ];

  if (!configured) return defaults;
  return [configured, ...defaults.filter((m) => m !== configured)];
}

/**
 * Generate a short Veo 3.1 Fast video clip from a still image.
 *
 * @param sceneKey  The scene key used for prompt context.
 * @param base64Jpeg  The Imagen 4 still as base64 JPEG (used as reference image).
 * @returns  The GCS URI of the generated video, or null on failure/timeout.
 */
export async function generateSceneVideo(
  sceneKey: string,
  base64Jpeg: string,
): Promise<string | null> {
  const animHint = resolveAnimationHint(sceneKey);
  const prompt = `First-person POV underground cinematic exploration. ${animHint} Cinematic, photorealistic, slow atmospheric camera movement, no people visible, 8K quality.`;
  const veoConfig = {
    numberOfVideos: 1,
    durationSeconds: 6,
    fps: 24,
    aspectRatio: "16:9",
    personGeneration: "ALLOW_ADULT",
    negativePrompt: NEGATIVES,
    safetyFilterLevel: "BLOCK_ONLY_HIGH",
    addWatermark: false,
    enhancePrompt: true,
  };

  console.log(
    `[Veo] Starting Veo 3.1 Fast generation for sceneKey="${sceneKey}"`,
  );

  try {
    const modelCandidates = getVeoModelCandidates();
    let operation: GenerateVideosOperation | null = null;
    let selectedModel: string | null = null;

    for (const model of modelCandidates) {
      try {
        operation = await getVeoAiClient().models.generateVideos({
          model,
          image: {
            imageBytes: base64Jpeg,
            mimeType: "image/jpeg",
          },
          config: veoConfig as never,
          prompt,
        });
        selectedModel = model;
        break;
      } catch (candidateErr) {
        const msg = (candidateErr as Error).message;
        // Continue for model-not-found/access errors; surface other failures immediately.
        if (
          msg.includes("NOT_FOUND") ||
          msg.includes("was not found") ||
          msg.includes("does not have access")
        ) {
          console.warn(
            `[Veo] Model unavailable "${model}" for sceneKey="${sceneKey}": ${msg}`,
          );
          continue;
        }
        throw candidateErr;
      }
    }

    if (!operation || !selectedModel) {
      console.error(
        `[Veo] No available Veo model found for sceneKey="${sceneKey}"`,
      );
      return null;
    }
    console.log(
      `[Veo] Using model "${selectedModel}" for sceneKey="${sceneKey}"`,
    );

    // Poll until the operation completes or we time out
    const startTime = Date.now();
    while (!operation.done) {
      if (Date.now() - startTime > MAX_POLL_MS) {
        console.warn(
          `[Veo] Timed out after ${MAX_POLL_MS / 1000}s for sceneKey="${sceneKey}"`,
        );
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      operation = await getVeoAiClient().operations.getVideosOperation({
        operation,
      });
    }

    if (operation.error) {
      console.error(
        `[Veo] Operation error for sceneKey="${sceneKey}":`,
        operation.error,
      );
      return null;
    }

    if ((operation.response?.raiMediaFilteredCount ?? 0) > 0) {
      console.warn(
        `[Veo] Output filtered by RAI for sceneKey="${sceneKey}". count=${operation.response?.raiMediaFilteredCount}`,
      );
      console.warn(
        `[VEO] RAI filter blocked: sceneKey="${sceneKey}" count=${operation.response?.raiMediaFilteredCount}`,
      );
      console.warn(
        `[Veo] RAI reasons for sceneKey="${sceneKey}": ${JSON.stringify(operation.response?.raiMediaFilteredReasons ?? [])}`,
      );
      return null;
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      console.warn(`[Veo] No video URI in response for sceneKey="${sceneKey}"`);
      return null;
    }

    console.log(
      `[Veo] Video generated — sceneKey="${sceneKey}", uri="${videoUri}"`,
    );
    return videoUri;
  } catch (err) {
    console.error(
      `[Veo] generateVideos failed for sceneKey="${sceneKey}":`,
      (err as Error).message,
    );
    return null;
  }
}
