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
    "Inside a Boring Company tunnel under Las Vegas, offscreen headlight projection sweeps slowly left and right through darkness as Jason gets his bearings, smooth cylindrical concrete briefly appears only where the beam lands, no hands visible, no extra environment revealed beyond the beam",

  generator_area_start:
    "Continuation from the first tunnel scan, Jason explores farther down the same Boring tunnel, offscreen headlight projection pushes deeper into the concrete cylinder, industrial detail slowly emerges in the distance, and the video ends with the beam settling toward a generator farther ahead",

  generator_area_operational:
    "Starting from the still where the generator is distant in the tunnel, Jason walks toward it through the same Boring tunnel, headlight locked on the generator body as it grows larger in frame, tunnel lights still off, no card visible yet",

  generator_card_reveal:
    "Jason reaches the generator and turns it on, practical tunnel lights come alive, headlamp switches off, the frame rebalances to the new ambient light, and only then does a Joker card become visible on the ground near the generator base",

  card1_pickup_pov:
    "The card remains visible near the generator in full tunnel context until either the player clicks the frontend card overlay or the one-minute timer expires, then Jason crouches and picks it up in natural POV without any close framing",

  vision_flash:
    "Deprecated alias. Use wildcard_vision_feed for the live anomaly feed sequence",

  tunnel_to_park_transition:
    "This video begins from the still after the wildcard feed resolves. Jason moves forward through the Boring tunnel toward the impossible opening ahead, and the shot only plays when the correct player phrase is spoken or the one-minute autoplay timer expires",

  park_transition_reveal:
    "Continuation from the end of video 5, Jason advances to the threshold and the image opens from tunnel dominance into the first full reveal of the underground waterpark, ending on the next still state",

  park_entrance:
    "Continuation from image 7, Jason crosses the threshold into a perfect operational underground waterpark where clean slides, lit pools, and tropical foliage have crashed into the Boring tunnel, movement is slow and observant",

  park_walkway:
    "Continuation from image 8, Jason explores the park walkways between active water features, lazy rivers, pools, slides, and waterfalls, emphasizing the scale of a full park while staying in first-person motion",

  park_shaft_view:
    "Continuation from image 9, Jason's movement through the waterpark naturally brings a distant maintenance shaft into view while paradise features remain active in the foreground, ending on the shaft-view still",

  maintenance_entry:
    "Continuation from image 10, Jason leaves the waterpark path and enters the maintenance corridor, park light recedes behind him and industrial geometry takes over, ending on the maintenance still",

  maintenance_panel:
    "Starting from the maintenance still, this puzzle-sequence video only plays if the player gives the panel-removal instruction or autoplay resolves the choice, Jason investigates and moves the panel until the hidden card is revealed",

  card2_pickup_pov:
    "Starting from the revealed-card still, a 30-second card-click window exists. If the player clicks in time, Jason collects the card in first-person without close framing, then a different glitch transition leads into frantic movement back toward the waterpark and Audrey's voice beyond",

  wildcard_vision_feed:
    "Security camera footage. The room shown in the reference image stays exactly as it appears. Subtle atmospheric animation only: faint natural light flicker, minimal air movement. No camera movement. No new subjects or objects enter the frame. No scene change. No new locations.",

  wildcard_game_over:
    "Security camera footage of an empty Boring Company tunnel. A dark featureless silhouette stands motionless at the far end of the tunnel. After several seconds the frame erupts in full-screen digital glitch distortion. When the glitch clears the silhouette now stands directly in front of the camera filling the frame. The frame then floods with white static noise.",

  wildcard_good_ending:
    "Security camera footage. Underground waterpark at night. Turquoise water light ripples and shimmers across concrete walls and ceiling. Ambient sound of distant water. From somewhere far down a corridor, a woman's reverberating voice: 'Jason... where are you?' The voice is faint and distant. No camera movement.",
};

/** Resolve a motion-description suffix for a given sceneKey. */
function resolveAnimationHint(sceneKey: string): string {
  const key = sceneKey.toLowerCase();
  for (const zoneId of Object.keys(ANIMATION_HINTS)) {
    if (key.includes(zoneId)) return ANIMATION_HINTS[zoneId];
  }
  // Keyword fallbacks
  if (key.includes("wildcard") || key.includes("vision_feed"))
    return ANIMATION_HINTS["wildcard_vision_feed"];
  if (key.includes("good_ending"))
    return ANIMATION_HINTS["wildcard_good_ending"];
  if (key.includes("game_over")) return ANIMATION_HINTS["wildcard_game_over"];
  if (key.includes("card2") || key.includes("final_card"))
    return ANIMATION_HINTS["card2_pickup_pov"];
  if (key.includes("panel") || key.includes("hidden"))
    return ANIMATION_HINTS["maintenance_panel"];
  if (key.includes("maintenance_entry") || key.includes("maintenance"))
    return ANIMATION_HINTS["maintenance_entry"];
  if (key.includes("shaft")) return ANIMATION_HINTS["park_shaft_view"];
  if (key.includes("park_transition"))
    return ANIMATION_HINTS["park_transition_reveal"];
  if (
    key.includes("park") ||
    key.includes("shore") ||
    key.includes("shallow") ||
    key.includes("slide") ||
    key.includes("deep")
  )
    return ANIMATION_HINTS["park_walkway"];
  if (key.includes("card") || key.includes("joker"))
    return ANIMATION_HINTS["card1_pickup_pov"];
  if (key.includes("vision") || key.includes("flash"))
    return ANIMATION_HINTS["vision_flash"];
  if (key.includes("transition") || key.includes("tunnel"))
    return ANIMATION_HINTS["tunnel_to_park_transition"];
  if (key.includes("generator_operational"))
    return ANIMATION_HINTS["generator_area_operational"];
  if (key.includes("generator_card"))
    return ANIMATION_HINTS["generator_card_reveal"];
  if (key.includes("generator_start"))
    return ANIMATION_HINTS["generator_area_start"];
  if (key.includes("generator")) return ANIMATION_HINTS["generator_area_start"];
  return ANIMATION_HINTS["flashlight_beam"];
}

/** Maximum time to poll before giving up (ms). */
const MAX_POLL_MS = 120_000;
/** Interval between polls (ms). */
const POLL_INTERVAL_MS = 10_000;

function getVideoDurationSeconds(sceneKey: string): number {
  const key = sceneKey.toLowerCase();
  if (
    key.includes("wildcard") ||
    key.includes("vision_feed") ||
    key.includes("game_over")
  ) {
    return 8;
  }
  return 6;
}

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
  const isWildcard =
    sceneKey.includes("wildcard_game_over") ||
    sceneKey.includes("wildcard_good_ending");
  // Wildcard prompts are self-contained — no wrapper additions needed.
  // Non-wildcard prompts get the standard cinematic wrapper.
  const prompt = isWildcard
    ? animHint
    : `First-person POV underground cinematic exploration. ${animHint} Cinematic, photorealistic, slow atmospheric camera movement, no people visible, 8K quality.`;

  // Pin last frame only for good_ending — the waterpark must stay locked/still.
  // game_over intentionally has no lastFrame pin: the shadow entity rushes
  // toward the camera (subject movement), and some Veo dolly into the action
  // only amplifies the horror impact.
  const lastFrameConfig = sceneKey.includes("wildcard_good_ending")
    ? { imageBytes: base64Jpeg, mimeType: "image/jpeg" as const }
    : undefined;

  const veoConfig = {
    numberOfVideos: 1,
    durationSeconds: getVideoDurationSeconds(sceneKey),
    fps: 24,
    aspectRatio: "16:9",
    personGeneration: "ALLOW_ADULT",
    negativePrompt: NEGATIVES,
    safetyFilterLevel: "BLOCK_ONLY_HIGH",
    addWatermark: false,
    enhancePrompt: true,
    ...(lastFrameConfig && { lastFrame: lastFrameConfig }),
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

    const video = operation.response?.generatedVideos?.[0]?.video;
    const videoUri = video?.uri;
    if (videoUri) {
      console.log(
        `[Veo] Video generated — sceneKey="${sceneKey}", uri="${videoUri}"`,
      );
      return videoUri;
    }

    // Fallback: Veo may return inline bytes instead of a GCS URI
    const videoBytes = (video as { videoBytes?: string } | undefined)
      ?.videoBytes;
    if (videoBytes) {
      const dataUri = `data:video/mp4;base64,${videoBytes}`;
      console.log(
        `[Veo] Video generated (inline bytes) — sceneKey="${sceneKey}"`,
      );
      return dataUri;
    }

    console.warn(`[Veo] No video URI or bytes in response for sceneKey="${sceneKey}"`);
    return null;
  } catch (err) {
    console.error(
      `[Veo] generateVideos failed for sceneKey="${sceneKey}":`,
      (err as Error).message,
    );
    return null;
  }
}

/**
 * Generate a short Veo clip directly from text prompt context (no reference image).
 * Used for wildcard fallback/ending branches that should be prepared in the background.
 */
export async function generateSceneVideoFromText(
  sceneKey: string,
): Promise<string | null> {
  const animHint = resolveAnimationHint(sceneKey);
  const prompt = `First-person POV underground cinematic exploration. ${animHint} Cinematic, photorealistic, slow atmospheric camera movement, no people visible, 8K quality.`;
  const veoConfig = {
    numberOfVideos: 1,
    durationSeconds: getVideoDurationSeconds(sceneKey),
    fps: 24,
    aspectRatio: "16:9",
    personGeneration: "ALLOW_ADULT",
    negativePrompt: NEGATIVES,
    safetyFilterLevel: "BLOCK_ONLY_HIGH",
    addWatermark: false,
    enhancePrompt: true,
  };

  console.log(
    `[Veo] Starting text-to-video generation for sceneKey="${sceneKey}"`,
  );

  try {
    const modelCandidates = getVeoModelCandidates();
    let operation: GenerateVideosOperation | null = null;
    let selectedModel: string | null = null;

    for (const model of modelCandidates) {
      try {
        operation = await getVeoAiClient().models.generateVideos({
          model,
          config: veoConfig as never,
          prompt,
        });
        selectedModel = model;
        break;
      } catch (candidateErr) {
        const msg = (candidateErr as Error).message;
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
      return null;
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    const videoUri = video?.uri;
    if (videoUri) {
      console.log(
        `[Veo] Text-to-video generated — sceneKey="${sceneKey}", uri="${videoUri}"`,
      );
      return videoUri;
    }

    const videoBytes = (video as { videoBytes?: string } | undefined)
      ?.videoBytes;
    if (videoBytes) {
      const dataUri = `data:video/mp4;base64,${videoBytes}`;
      console.log(
        `[Veo] Text-to-video generated (inline bytes) — sceneKey="${sceneKey}"`,
      );
      return dataUri;
    }

    console.warn(`[Veo] No video URI or bytes in text-to-video response for sceneKey="${sceneKey}"`);
    return null;
  } catch (err) {
    console.error(
      `[Veo] text-to-video generateVideos failed for sceneKey="${sceneKey}":`,
      (err as Error).message,
    );
    return null;
  }
}
