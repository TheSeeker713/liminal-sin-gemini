import { getAiClient } from './gemini';

// ---------------------------------------------------------------------------
// Canonical Imagen 4 prompts — sourced verbatim from docs/Tunnel-and-park.md
// where marked, and derived from zone descriptions for the 4 remaining zones.
// NEVER include 'smart glasses', 'cracked screen', or human figures in prompts.
// All prompts are first-person POV per lore invariant.
// ---------------------------------------------------------------------------
const ZONE_PROMPTS: Record<string, string> = {
  zone_tunnel_entry: `First-person POV standing inside an unfinished Boring Company tunnel, looking ahead
down the white smooth-concrete cylinder, precast segmented ring walls with diagonal
bolt-plate seams, cold LED strip lighting along ceiling (flickering), concrete dust
on floor, tire tracks pressed into the dust leading into the far wall and stopping,
no people, photorealistic architectural photography, wide angle 16mm, brutalist
concrete, desaturated cool palette, mist in mid-air, cinematic horror, 8K`,

  zone_tunnel_mid: `First-person POV deep inside an unfinished Boring Company tunnel, cold LED strip
lighting flickering overhead, smooth white-concrete cylinder walls with diagonal
bolt-plate seams, Tesla EV tire tracks in concrete dust leading directly into a
seamless intact wall ahead and stopping — the tracks simply end, no impact, no
disturbance, as if the vehicle drove into the solid wall and vanished, no people,
photorealistic architectural photography, wide angle 16mm, brutalist concrete,
desaturated cool palette, cinematic horror, 8K`,

  zone_merge: `First-person POV standing at a ruptured concrete threshold where a Boring Company
tunnel has broken into a vast dark chamber, fractured precast concrete segments with
displaced rebar bent outward as if pushed through from the other side, cold white
LED light from behind transitioning to warm orange amber flood construction light
ahead, visible breath mist drifting through the rupture into darkness, edges of a
vast abandoned structure visible beyond the threshold, no people, photorealistic
wide angle 16mm, brutalist concrete and rebar, desaturated cool-warm contrast at
threshold, cinematic horror, 8K`,

  zone_park_shore: `First-person POV standing at the edge of an underground abandoned water park,
looking out across a vast subterranean chamber, brutalist exposed concrete arched
ribbed ceiling rising to 40 feet, warm orange flood construction lights on tripod
stands casting pools of amber glow, still dark water covering the concrete floor,
half-submerged fiberglass water slides in faded primary colors (red, yellow, blue)
receding into the dark water, perfect mirror reflection in still water creating
a doubled downward space, reflections geometrically wrong, no people,
photorealistic architectural photography, wide angle 16mm, desaturated cool-warm
contrast palette, cinematic horror, 8K`,

  zone_park_shallow: `First-person POV wading through shallow dark water, ten inches deep, in an
underground abandoned water park, looking across a vast subterranean concrete
floor partially flooded, warm orange flood construction lights on tripod stands
at the perimeter reflecting in the perfectly still water surface, abandoned
fiberglass water slides in faded red and yellow visible in the middle distance,
disturbed water rings spreading from footsteps, no people, photorealistic
wide angle 16mm, brutalist concrete, desaturated cool-warm contrast palette,
cinematic horror, 8K`,

  zone_park_slides: `First-person POV looking up at an abandoned underground water park slide structure,
large fiberglass tube slide in faded red and yellow above the waterline, brutalist
ribbed concrete arched ceiling at 40 feet overhead, warm orange flood construction
light casting amber glow from below, black water at the base disappearing into the
slide entrance, slide surface coated with biological patina, no people, photorealistic
wide angle 16mm, brutalist concrete and aging fiberglass, desaturated with amber
light accent, cinematic horror, 8K`,

  zone_park_deep: `First-person POV standing at the edge of an underground water park deep pool,
looking down into five feet of utterly still black water, smooth concrete pool floor
visible through the depth, a water slide continuing down into the pool underwater
still visible, a faint suggestion of a wider cavern opening below the pool floor —
natural stone not concrete — deep beyond the lit zone, warm amber construction flood
lights on tripod stands reflecting as inverted orange pillars in the still water,
no people, no movement, photorealistic wide angle 16mm, cinematic horror, 8K`,

  slotsky_card: `First-person POV looking down at an underground water park floor, shallow dark water
over wet concrete, three playing cards arranged in a deliberate triangular pattern
(queen of spades, jack of clubs, ace of hearts) lying flat on the floor, no one near
them, single warm flood construction light casting a hard shadow from the right,
the cards were not there before, photorealistic, wide angle 24mm, brutalist concrete
and still water, desaturated with amber light accent, cinematic horror, 8K`,

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
a single playing card — jack of clubs, face-up, pristine — lying flat on wet
concrete at the base of the generator, isolated in a tight flashlight spotlight
as if placed deliberately, no other people, photorealistic, wide angle 24mm,
brutalist industrial concrete, oil-stained floor, cinematic horror, 8K`,

  maintenance_area: `First-person POV standing in an industrial maintenance corridor branching off an
underground water park, exposed pipe clusters and electrical conduit running along
low brutalist concrete ceiling, faded yellow safety signage barely legible on damp
walls, flashlight cone cutting forward into the industrial dark, through an open
arched doorway in the background the park's aquamarine neon glow bleeds into frame —
a sliver of paradise behind the industrial grimness, decorative arch frame with
moisture-stained painted tropical mural barely visible through the staining, no
people, photorealistic, wide angle 16mm, industrial concrete with neon bleed,
cinematic horror, 8K`,

  card2_closeup: `Close-up first-person POV, a queen of spades playing card lying face-up held in an
open palm, flashlight beam from directly above casting hard-edged shadows from card
corners onto the palm below, card surface pristine and bone-dry despite the
surrounding damp, wet concrete floor faintly visible blurred in the background,
photorealistic, 50mm macro-style lens, shallow depth of field, high contrast
flashlight illumination, cinematic horror, 8K`,
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
  if (key.includes('merge') || key.includes('rupture')) return ZONE_PROMPTS['zone_merge'];
  if (key.includes('shallow')) return ZONE_PROMPTS['zone_park_shallow'];
  if (key.includes('slide')) return ZONE_PROMPTS['zone_park_slides'];
  if (key.includes('deep')) return ZONE_PROMPTS['zone_park_deep'];
  if (key.includes('shore') || key.includes('park')) return ZONE_PROMPTS['zone_park_shore'];
  if (key.includes('card') || key.includes('slotsky')) return ZONE_PROMPTS['slotsky_card'];
  if (key.includes('tunnel')) return ZONE_PROMPTS['zone_tunnel_entry'];

  // Default: tunnel entry (where the session always begins)
  return ZONE_PROMPTS['zone_tunnel_entry'];
}

/**
 * Generates a first-person POV scene image via Imagen 4 for the given scene_key.
 * Returns a base64-encoded JPEG string, or null on failure.
 */
export async function generateSceneImage(sceneKey: string): Promise<string | null> {
  const prompt = resolvePrompt(sceneKey);
  console.log(`[Imagen] Generating image for sceneKey="${sceneKey}" (${sceneKey.split('_').slice(2, 4).join('_')} context)`);

  try {
    const response = await getAiClient().models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      console.warn(`[Imagen] No imageBytes in response for sceneKey="${sceneKey}"`);
      return null;
    }

    console.log(`[Imagen] Scene image generated — sceneKey="${sceneKey}"`);
    return imageBytes;
  } catch (err) {
    console.error(`[Imagen] generateImages failed for sceneKey="${sceneKey}":`, (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image pre-load cache — keyed sessionId → sceneKey → base64JPEG
// Populated at session start to eliminate first-scene latency.
// ---------------------------------------------------------------------------
const imageCache = new Map<string, Map<string, string>>();

const PREWARM_SCENE_KEYS = ['flashlight_beam', 'zone_merge', 'zone_park_shore'] as const;

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
        console.log(`[ImageCache] PRE-WARMED — session="${sessionId}" key="${key}"`);
      }
    })
  );
}

/**
 * Returns a cached base64 JPEG for the given session+sceneKey, or null on miss.
 */
export function getCachedImage(sessionId: string, sceneKey: string): string | null {
  const sessionMap = imageCache.get(sessionId);
  if (!sessionMap) return null;
  // Try exact match first, then partial zone-ID substring match
  if (sessionMap.has(sceneKey)) {
    console.log(`[ImageCache] HIT — session="${sessionId}" key="${sceneKey}"`);
    return sessionMap.get(sceneKey)!;
  }
  for (const [cachedKey, base64] of sessionMap) {
    if (sceneKey.includes(cachedKey) || cachedKey.includes(sceneKey)) {
      console.log(`[ImageCache] HIT (fuzzy) — session="${sessionId}" cached="${cachedKey}" requested="${sceneKey}"`);
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
