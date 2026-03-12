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
  zone_tunnel_entry:
    "Slow cinematic camera drift forward through the tunnel. Flickering LED lights overhead cast moving shadows on concrete walls. Dust motes float through the air.",
  zone_tunnel_mid:
    "Very slow dolly forward. LED strips flicker. A faint haze drifts across the frame. Tire tracks on the floor lead into the wall ahead.",
  zone_merge:
    "Camera slowly passes through the ruptured threshold. Rebar sways slightly. Breath mist drifts from cold into warm air. Construction light flickers once.",
  zone_park_shore:
    "Extremely slow pan across the flooded water park. Still water surface has subtle ripples. Orange flood lights cast shifting amber reflections. Distant slide structures loom.",
  zone_park_shallow:
    "First-person wading motion. Water ripples spread from each step. Warm amber light reflects and shimmers on the water surface. Faded water slides in the distance.",
  zone_park_slides:
    "Slow upward tilt looking at the slide structure. Amber construction light flickers. A single drop of water falls from the slide into dark water below.",
  zone_park_deep:
    "Camera slowly leans forward over deeper water. Amber light pillars shimmer in the reflection. Soft ripples travel across the surface and fade naturally.",
  slotsky_card:
    "Camera slowly lowers to ground level. The playing cards are motionless but the shadow from the flood light shifts slightly, as if the light source moved on its own.",

  flashlight_beam:
    "Flashlight beam sweeps slowly left then right through total darkness, catching suspended water droplets as it moves — each droplet briefly lit then returns to black — no environment fills in during the sweep, only what the beam directly touches is visible, beam completes one full sweep and returns to center pointing forward, holds steady",

  generator_area:
    "Slow downward tilt from the generator body, flashlight tracking down toward the playing card at the generator's base, slight mechanical vibration in the frame from the running generator, beam contracts tighter around the card as if drawn to it, card remains perfectly still, camera holds on the card",

  maintenance_area:
    "Rapid exploratory scan, flashlight sweeps left to right across pipes and conduit, beam pauses briefly on darker alcoves, then swings back to the aquamarine-glowing park doorway in the background — the neon glow through the arch flickers once — then flashlight swings forward",

  card2_closeup:
    "Camera holds steady on the queen of spades card in the palm. Subtle natural lighting shifts as if the flashlight breath-wavers. Card surface catches light. Minimal motion — the card is held perfectly still.",
};

/** Resolve a motion-description suffix for a given sceneKey. */
function resolveAnimationHint(sceneKey: string): string {
  const key = sceneKey.toLowerCase();
  for (const zoneId of Object.keys(ANIMATION_HINTS)) {
    if (key.includes(zoneId)) return ANIMATION_HINTS[zoneId];
  }
  // Keyword fallbacks
  if (key.includes("merge") || key.includes("rupture"))
    return ANIMATION_HINTS["zone_merge"];
  if (key.includes("shallow")) return ANIMATION_HINTS["zone_park_shallow"];
  if (key.includes("slide")) return ANIMATION_HINTS["zone_park_slides"];
  if (key.includes("deep")) return ANIMATION_HINTS["zone_park_deep"];
  if (key.includes("shore") || key.includes("park"))
    return ANIMATION_HINTS["zone_park_shore"];
  if (key.includes("card") || key.includes("slotsky"))
    return ANIMATION_HINTS["slotsky_card"];
  if (key.includes("tunnel")) return ANIMATION_HINTS["zone_tunnel_entry"];
  return ANIMATION_HINTS["zone_tunnel_entry"];
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
