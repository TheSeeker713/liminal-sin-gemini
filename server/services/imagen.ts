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
forward through absolute blackness, Jason's right hand visible at the bottom of
frame gripping a heavy rubberized flashlight, beam illuminating wet concrete floor
ahead and catching water droplets suspended in mid-air, walls beyond the beam edge
barely visible in peripheral darkness as faint grey, cold white light source, pure
black surround, no ambient lighting anywhere, photorealistic horror photography,
wide angle 16mm, high contrast, cinematic horror, 8K`,

  generator_area: `First-person POV looking toward an industrial diesel generator unit set against
rough dark concrete wall underground, warm amber flashlight glow from below
illuminating the battered metal generator housing and surrounding concrete floor,
a single joker playing card — face-up, pristine, vivid colorful illustration —
lying flat on wet concrete at the base of the generator, isolated in a tight
flashlight spotlight as if placed deliberately, no other people, photorealistic,
wide angle 16mm, brutalist industrial concrete, oil-stained floor, cinematic horror, 8K`,

  park_entrance: `First-person POV standing at the threshold where a Boring Company tunnel wall has
ruptured open, the broken concrete arch frames a vast underground water park in full
vibrant operation beyond — bright turquoise pool water under full-spectrum artificial
sunlight, clean white and cobalt-blue fiberglass slides curving overhead, working neon
signs in pink and tropical green casting vivid color reflections across the water
surface, real tropical palms and bird-of-paradise plants thriving, the park looks
completely intact and operational with no visible damage or decay, no people,
photorealistic, wide angle 16mm, vibrant saturated color palette, cinematic, 8K`,

  park_walkway: `First-person POV walking along a dry concrete promenade path through a massive
underground water park, operational turquoise pools extending wide on both sides,
clean white and cobalt fiberglass slides spiraling high above, a cascading waterfall
thundering over artificial rock formations ahead, a lazy river circuit visible through
a palm-lined walkway to the right, the cavern ceiling is lost in the distance above the
artificial lighting, the park interior is enormous — fully operational and immaculate,
no guests, in the far background a recessed maintenance corridor entrance is cut into
the cavern rock wall barely visible beyond the park lights, no people, photorealistic,
wide angle 16mm, vibrant color palette, cinematic, 8K`,

  maintenance_area: `First-person POV standing in an industrial maintenance corridor branching off an
underground water park, exposed pipe clusters and electrical conduit running along
low brutalist concrete ceiling, faded yellow safety signage barely legible on damp
walls, flashlight cone cutting forward into the industrial dark, through an open
arched doorway in the background the park's aquamarine neon glow bleeds into frame —
a sliver of paradise behind the industrial grimness, decorative arch frame with
moisture-stained painted tropical mural barely visible through the staining, no
people, photorealistic, wide angle 16mm, industrial concrete with neon bleed,
cinematic horror, 8K`,
};

export type SceneImageGeneration = {
  imageBytes: string;
  seed: number | null;
};

/**
 * Maps a GM-issued scene_key to a zone prompt.
 * Tries direct substring match on zone IDs first, then keyword fallbacks.
 * Format reminder: {character}_{emotion}_{context}_{action}
 */
function resolvePrompt(sceneKey: string): string {
  const key = sceneKey.toLowerCase();

  // Direct zone ID matches (most specific)
  for (const zoneId of Object.keys(ZONE_PROMPTS)) {
    if (key.includes(zoneId)) return ZONE_PROMPTS[zoneId];
  }

  // Keyword fallbacks for coarse scene_key contexts
  if (key.includes("park") || key.includes("shore") || key.includes("shallow") || key.includes("slide") || key.includes("deep"))
    return ZONE_PROMPTS["park_walkway"];
  if (key.includes("maintenance") || key.includes("card") || key.includes("slotsky"))
    return ZONE_PROMPTS["maintenance_area"];
  if (key.includes("generator"))
    return ZONE_PROMPTS["generator_area"];

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

// ---------------------------------------------------------------------------
// Image pre-load cache — keyed sessionId → sceneKey → base64JPEG
// Populated at session start to eliminate first-scene latency.
// ---------------------------------------------------------------------------
const imageCache = new Map<string, Map<string, string>>();

const PREWARM_SCENE_KEYS = [
  "flashlight_beam",
  "generator_area",
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
