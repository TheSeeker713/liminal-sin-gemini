import { RawReferenceImage, SafetyFilterLevel } from "@google/genai";
import { getAiClient } from "./gemini";
import { NEGATIVES } from "./mediaSafety";

// ---------------------------------------------------------------------------
// Canonical Imagen 4 prompts — Act 1 primary scene keys only.
// All scenes: 16:9, high quality photorealistic, cinematic, first-person POV.
// NEVER include 'smart glasses', 'cracked screen', or human figures in prompts.
// No close-up shots of any kind — maintain Jason's natural POV at all times.
// ---------------------------------------------------------------------------
const ZONE_PROMPTS: Record<string, string> = {
  flashlight_beam: `First-person POV in total darkness underground, a single flashlight beam shooting
forward through pure blackness inside a Boring Company tunnel under Las Vegas,
smooth white cylindrical concrete tunnel walls just barely caught where the beam
passes, offscreen headlight projection only, no visible hands, no visible body,
no ambient fill light, wide environmental framing only, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  generator_area_start: `First-person POV stepping into a dim industrial bay underground,
continuation of the same Boring Company tunnel under Las Vegas after getting bearings,
offscreen headlight projection reaches farther down the tunnel, smooth cylindrical
concrete geometry continues ahead, industrial equipment begins to emerge in the far
distance, generator only faintly suggested at end of beam path, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  generator_area_operational: `First-person POV facing the same generator after initial inspection,
continuation from deeper inside the same Boring Company tunnel, offscreen headlight
projection now lands clearly on an industrial generator still a little distance ahead,
generator framed inside the tunnel cylinder with floor and tunnel curvature still visible,
lights in the tunnel remain off, no card visible yet, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  generator_card_reveal: `First-person POV in generator bay with flashlight angled down,
standing at the generator inside the same Boring Company tunnel after power-on,
tunnel practical lights are now on, headlamp is off, generator fills near-mid frame,
a single Joker card is now visible on the floor near the base of the generator,
environment remains fully readable, no close-up framing, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  card1_pickup_pov: `First-person POV crouching naturally near generator base,
continuation after generator activation, Joker card visible on the tunnel floor near
the generator with full environmental context preserved, framing remains natural POV
from Jason's eye line in the Boring tunnel, no close-up framing, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  tunnel_to_park_transition: `First-person POV moving forward from industrial tunnel into a larger
continuation from the generator tunnel, moving deeper through the same Boring tunnel
toward an impossible opening ahead where waterpark color and humidity begin to invade
the industrial space, tunnel still dominates the frame, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  park_transition_reveal: `First-person POV paused at threshold where tunnel concrete meets
continuation from the end of the preceding tunnel-to-park video, Boring tunnel concrete
still present in foreground while the impossible underground waterpark now opens wider
ahead, humid light, reflective surfaces, clean architecture, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  park_entrance: `First-person POV at a ruptured tunnel wall framing a vast underground
waterpark in full operation, bright turquoise pools, clean white-and-cobalt slides,
working neon accents, living tropical foliage, immaculate maintenance state,
no decay, no abandonment, no people, photorealistic cinematic image,
wide angle 16mm, 16:9, 8K`,

  park_walkway: `First-person POV walking dry promenade paths through a huge
operational underground waterpark, slides overhead, lazy river channels,
cascading waterfalls, lit pool systems, far-depth cavern scale,
no people, photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  park_shaft_view: `First-person POV from waterpark interior looking toward a distant
maintenance shaft entry inset beyond pools and walkways,
foreground remains paradise architecture while the target shaft is clearly visible,
no people, photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  maintenance_entry: `First-person POV crossing from park edge into industrial
maintenance corridor, exposed piping, damp concrete, utility fixtures,
park glow lingering behind through doorway, no people,
photorealistic cinematic image, wide angle 16mm, 16:9, 8K`,

  maintenance_panel: `First-person POV deeper in maintenance facing a movable
utility panel and disturbed floor pattern suggesting hidden access,
flashlight scanning seams and handles, full corridor context visible,
no close-up framing, no people, photorealistic cinematic image,
wide angle 16mm, 16:9, 8K`,

  card2_pickup_pov: `First-person POV in maintenance after hidden compartment reveal,
final card now revealed in maintenance area after panel removal, card visible within
full corridor context with panel, floor, and geometry preserved in frame,
no close-up framing, no people, photorealistic cinematic image,
wide angle 16mm, 16:9, 8K`,

  wildcard_vision_feed: `This is a real photograph of a real room. Do not change anything about the room, the walls, the furniture, the lighting, or the person in the photograph. Preserve every pixel of the original scene. Add only this: a dark human-shaped shadow cast onto the wall or surface directly behind and slightly to the side of the person. The shadow must look like a real shadow cast by a light source — not a cartoon, not a cutout, not a silhouette pasted on top of the person. It should appear as part of the existing lighting on the wall itself. The shadow figure is taller than the person and slightly more menacing in posture. It must appear physically real, photographic, and deeply unsettling. No new objects, no masks, no faces, no costumes, no text, no borders.`,

  wildcard_game_over: `POV of Jason (offscreen), an industrial Boring company tunnel connecting to a series of labyrinthine tunnels, walls are peeling, some distortion glitches on the edges of the screen. Image is heavy with film-grade noise. Liminal spaces. No people, no faces, no hands, no bodies. Photorealistic cinematic image, 16:9, 8K`,

  wildcard_good_ending: `POV of Jason (offscreen), at a perfect and awe inspiring deep underground highly functional waterpark. He is standing in front of a lounge chair overlooking the beautiful majestic scenery. Liminal spaces. No people, no faces, no hands, no bodies. Shot on 35mm film, photographic grain, real location photography, not CGI, not 3D rendered, 16:9`,
};

export type SceneImageGeneration = {
  imageBytes: string;
  seed: number | null;
};

/**
 * Maps a GM-issued scene_key to a zone prompt.
 * Tries direct substring match on zone IDs first, then keyword fallbacks.
 * Canonical Act 1 scene keys only. See gmTools.ts triggerSceneChange.
 */
function resolvePrompt(sceneKey: string): string {
  const key = sceneKey.toLowerCase();

  // Direct zone ID matches (most specific)
  for (const zoneId of Object.keys(ZONE_PROMPTS)) {
    if (key.includes(zoneId)) return ZONE_PROMPTS[zoneId];
  }

  // Keyword fallbacks for coarse scene_key contexts
  if (key.includes("wildcard") || key.includes("vision_feed"))
    return ZONE_PROMPTS["wildcard_vision_feed"];
  if (key.includes("good_ending")) return ZONE_PROMPTS["wildcard_good_ending"];
  if (key.includes("game_over")) return ZONE_PROMPTS["wildcard_game_over"];
  if (key.includes("card2") || key.includes("final_card"))
    return ZONE_PROMPTS["card2_pickup_pov"];
  if (key.includes("panel") || key.includes("hidden"))
    return ZONE_PROMPTS["maintenance_panel"];
  if (key.includes("maintenance_entry") || key.includes("maintenance"))
    return ZONE_PROMPTS["maintenance_entry"];
  if (key.includes("shaft")) return ZONE_PROMPTS["park_shaft_view"];
  if (key.includes("park_transition"))
    return ZONE_PROMPTS["park_transition_reveal"];
  if (
    key.includes("park") ||
    key.includes("shore") ||
    key.includes("shallow") ||
    key.includes("slide") ||
    key.includes("deep")
  )
    return ZONE_PROMPTS["park_walkway"];
  if (key.includes("card") || key.includes("joker"))
    return ZONE_PROMPTS["card1_pickup_pov"];
  if (key.includes("vision") || key.includes("flash"))
    return ZONE_PROMPTS["wildcard_vision_feed"];
  if (key.includes("transition") || key.includes("tunnel"))
    return ZONE_PROMPTS["tunnel_to_park_transition"];
  if (key.includes("generator_operational"))
    return ZONE_PROMPTS["generator_area_operational"];
  if (key.includes("generator_card"))
    return ZONE_PROMPTS["generator_card_reveal"];
  if (key.includes("generator_start"))
    return ZONE_PROMPTS["generator_area_start"];
  if (key.includes("generator")) return ZONE_PROMPTS["generator_area_start"];

  // Default: flashlight (where the visual session always begins)
  return ZONE_PROMPTS["flashlight_beam"];
}

/**
 * Generates a first-person POV scene image via Imagen 4 for the given scene_key.
 * Returns a base64-encoded JPEG string, or null on failure.
 */
export async function generateSceneImage(
  sceneKey: string,
): Promise<string | null> {
  const result = await generateSceneImageWithMeta(sceneKey);
  return result?.imageBytes ?? null;
}

/**
 * Generates a first-person POV scene image via Imagen 4 and returns image bytes
 * plus seed metadata when available.
 */
export async function generateSceneImageWithMeta(
  sceneKey: string,
): Promise<SceneImageGeneration | null> {
  const prompt = resolvePrompt(sceneKey);
  console.log(
    `[Imagen] Generating image for sceneKey="${sceneKey}" (${sceneKey.split("_").slice(2, 4).join("_")} context)`,
  );

  try {
    const response = await getAiClient().models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
        negativePrompt: NEGATIVES,
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      console.warn(
        `[Imagen] No imageBytes in response for sceneKey="${sceneKey}"`,
      );
      return null;
    }

    const first = response.generatedImages?.[0] as
      | { seed?: number; image?: { seed?: number } }
      | undefined;
    const seed =
      typeof first?.seed === "number"
        ? first.seed
        : typeof first?.image?.seed === "number"
          ? first.image.seed
          : null;

    console.log(`[Imagen] Scene image generated — sceneKey="${sceneKey}"`);
    return { imageBytes, seed };
  } catch (err) {
    console.error(
      `[Imagen] generateImages failed for sceneKey="${sceneKey}":`,
      (err as Error).message,
    );
    return null;
  }
}

/**
 * Edits a provided reference JPEG using Imagen image editing.
 * Used for wildcard player-camera anomaly generations.
 */
export async function generateEditedSceneImage(
  sceneKey: string,
  referenceBase64Jpeg: string,
): Promise<SceneImageGeneration | null> {
  const prompt = resolvePrompt(sceneKey);
  console.log(`[Imagen] Editing image for sceneKey="${sceneKey}"`);

  try {
    const response = await getAiClient().models.editImage({
      model: process.env.IMAGEN_EDIT_MODEL || "imagen-3.0-capability-001",
      prompt,
      referenceImages: (() => {
        const ref = new RawReferenceImage();
        ref.referenceImage = { imageBytes: referenceBase64Jpeg, mimeType: "image/jpeg" };
        ref.referenceId = 1;
        return [ref];
      })(),
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
        negativePrompt: NEGATIVES,
        safetyFilterLevel: SafetyFilterLevel.BLOCK_ONLY_HIGH,
        addWatermark: false,
        includeRaiReason: true,
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      console.warn(
        `[Imagen] No edited imageBytes in response for sceneKey="${sceneKey}"`,
      );
      return null;
    }

    const first = response.generatedImages?.[0] as
      | { seed?: number; image?: { seed?: number } }
      | undefined;
    const seed =
      typeof first?.seed === "number"
        ? first.seed
        : typeof first?.image?.seed === "number"
          ? first.image.seed
          : null;

    console.log(`[Imagen] Edited image generated - sceneKey="${sceneKey}"`);
    return { imageBytes, seed };
  } catch (err) {
    console.error(
      `[Imagen] editImage failed for sceneKey="${sceneKey}":`,
      (err as Error).message,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image pre-load cache — keyed sessionId → sceneKey → base64JPEG
// Populated at session start to eliminate first-scene latency.
// ---------------------------------------------------------------------------
const imageCache = new Map<string, Map<string, string>>();

const PREWARM_SCENE_KEYS = [
  "flashlight_beam",
  "generator_area_start",
  "park_entrance",
] as const;

/**
 * Pre-generates images for 3 canonical opening zones in parallel.
 * Fire-and-forget at session start (after intro_complete).
 */
export function prewarmImageCache(sessionId: string): void {
  const sessionMap = new Map<string, string>();
  imageCache.set(sessionId, sessionMap);
  void Promise.all(
    PREWARM_SCENE_KEYS.map(async (key) => {
      const base64 = await generateSceneImage(key);
      if (base64) {
        sessionMap.set(key, base64);
        console.log(
          `[ImageCache] PRE-WARMED — session="${sessionId}" key="${key}"`,
        );
      }
    }),
  );
}

/**
 * Returns a cached base64 JPEG for the given session+sceneKey, or null on miss.
 */
export function getCachedImage(
  sessionId: string,
  sceneKey: string,
): string | null {
  const sessionMap = imageCache.get(sessionId);
  if (!sessionMap) return null;
  // Try exact match first, then partial zone-ID substring match
  if (sessionMap.has(sceneKey)) {
    console.log(`[ImageCache] HIT — session="${sessionId}" key="${sceneKey}"`);
    return sessionMap.get(sceneKey)!;
  }
  for (const [cachedKey, base64] of sessionMap) {
    if (sceneKey.includes(cachedKey) || cachedKey.includes(sceneKey)) {
      console.log(
        `[ImageCache] HIT (fuzzy) — session="${sessionId}" cached="${cachedKey}" requested="${sceneKey}"`,
      );
      return base64;
    }
  }
  console.log(`[ImageCache] MISS — session="${sessionId}" key="${sceneKey}"`);
  return null;
}

/**
 * Frees memory for a session on WS close.
 */
export function clearImageCache(sessionId: string): void {
  imageCache.delete(sessionId);
  console.log(`[ImageCache] Cleared — session="${sessionId}"`);
}
