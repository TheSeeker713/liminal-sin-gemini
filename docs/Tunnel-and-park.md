# TUNNEL-AND-PARK.md — The Chamber
## Act 1 Environment Bible: The Boring Tunnel / Water Park Merge
### Version 1.1 | Day 3 — February 25, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 Section 2 (Layer 1) | Backpack.md v1.0
### Status: PRODUCTION CANON — AI generation prompts ACTIVE for Imagen 3 | Atmosphere specification

---

## DEMO SCOPE — ACTIVE (March 7–11, 2026)

> ⚠️ **The following defines what’s active in the contest demo vs. what requires deferred systems.**

| Feature | Demo Status | Notes |
|---|---|---|
| **Physical space description** | ✅ ACTIVE | All zone specs, sub-zone IDs, scene_key format |
| **AI generation prompts** | ✅ ACTIVE — IMAGEN 3 | Used directly as Imagen 3 inputs per scene_key trigger |
| **Static ambient audio** | ✅ ACTIVE | Drip, hum, voicebox static, echoing voices |
| **Slotsky reactive events** | ✅ ACTIVE | Bell event, card materialization, water disturbance, FOUND transition |
| **Lyria 3 procedural soundtrack** | ⛔ DEFERRED | Requires `docs/AUDIO_DESIGN.md`. Static files for demo. |
| **Smart glasses filter modes** | ⛔ DEFERRED | NV/IR/FS views require glasses HUD frontend. |
| **Deep pool Night Vision view** | ⛔ DEFERRED | Requires glasses NV filter. Act 2 seed not visible in demo. |
| **Multimeter Slotsky readings** | ⛔ DEFERRED | Requires backpack system and Jason’s production prompt. |

---

> *"It is unfinished but it has lights. Flood construction lights. And water. And something that used to be a water park, half-drowned, reflected in the dark surface until the room looks twice as large as it is and three times as wrong."*

---

## OVERVIEW

The **Boring Tunnel / Water Park Chamber** is the entirety of Act 1's physical world. It is a single large subterranean space that should not exist — a collision between two impossible realities stacked beneath Las Vegas. The Boring Company's unfinished transit tunnel has broken through into an abandoned underground water park, and neither space has been seen by anyone for a very long time.

This is where Jason lands. This is where Act 1 takes place. This is the only location in the prototype.

---

## THE PHYSICAL SPACE — CANONICAL DESCRIPTION

### Architecture
The chamber is formed by the intersection of two distinct structural types:

**The Boring Tunnel Section (North/Entry Zone)**
- Smooth, white concrete cylinder — the signature aesthetic of a Boring Company tunnel
- Circular cross-section, approximately 14 feet in diameter
- Unfinished: no track has been laid, no final surface treatment applied
- **Tesla tire tracks** are visible in the concrete dust on the floor — leading inward and then simply stopping at a wall. The wall is solid. The tracks go into it.
- LED strip lighting runs along the ceiling in the tunnel section — most strips are functional but flickering, a few are dead. The light is cold white with occasional blue-tint sections where different batches were installed.
- At one end: the tunnel mouth, now collapsed or sealed (not a usable exit)
- At the other end: the merge point where the tunnel breaks into the water park

**The Water Park Section (South/Depths Zone)**
- Much larger volume than the tunnel — the ceiling here rises to approximately 40 feet at its highest point
- Concrete and rebar construction, now dark with moisture staining
- The **flood construction lights** (orange-caged utility floods on tripod stands) were placed here at some point by construction crews. Several are still running. Their warmth contrasts sharply with the cold LED strips from the tunnel.
- **Water** covers approximately 40% of the floor in this section — still, dark, and cold. Approximately 8–18 inches deep in most areas, deeper in the pool sections.
- Half-submerged **water park slides**: fiberglass tube structures in faded primary colors — red, yellow, blue — now coated with a thin layer of biological material (not threatening, not glowing yet — that is Layer 3). Some slides are fully above the waterline. Others descend into the water and continue below the surface, visible through the dark reflective pool.
- **Reflective surfaces** are the defining visual feature of this zone. The still water creates a perfect mirror beneath the flood lights. The room appears twice as large as it is. The slides appear to extend downward into an identical chamber below. The drowned reflection is slightly wrong — the angles don't quite match, the light sources don't correspond.

### The Merge Point
The transition between the two sections is not architectural — it is a rupture. The tunnel wall broke inward at some point. The concrete is cracked and displaced. You can see rebar bent outward like something pushed through from the water park side. This is the physical scar of the noclip.

### Sub-Zones (For scene_key Mapping)
| Zone ID | Name | Description |
|---|---|---|
| `zone_tunnel_entry` | The Entry | Where Jason lands. Dry concrete, cracked glasses, cold LED light. The voicebox first activates here. |
| `zone_tunnel_mid` | The Midpoint | Tesla tire tracks end here. The wall they enter is solid. Multimeter goes haywire near this wall. |
| `zone_merge` | The Rupture | Broken concrete, displaced rebar, the threshold between tunnel and park. Draft of cold air from below. |
| `zone_park_shore` | The Shore | The edge of the water. Dry concrete gives way to the waterline. The slides are visible from here. |
| `zone_park_shallow` | The Shallows | Wading depth (8–12 inches). Most of the park's open floor area. Playing cards found here after Slotsky events. |
| `zone_park_slides` | The Slides | The fiberglass tube structures, some accessible, some only partially above water. |
| `zone_park_deep` | The Deep | The pool sections. 4–6 feet of still water. The slides continue down into this. What's below is Act 2. |

---

## LIGHTING — DETAILED SPECIFICATION

Lighting in the chamber is not consistent. It is a patchwork of different sources with different temperatures, creating zones of relative safety and relative darkness.

| Source | Zone | Color Temperature | Status |
|---|---|---|---|
| Boring Co. LED strips | Tunnel section | Cold white / occasional blue-tint | Mostly functional, intermittent flicker |
| Flood construction lights (tripods) | Water park shore/shallows | Warm orange-amber | 4 of 6 still running. 2 are dead. |
| Reflected light on water | All park zones | Doubled and slightly offset | Creates visual depth confusion |
| Jason's flashlight | Wherever Jason is | Cool white cone | The only mobile light source |
| Smart glasses Night Vision | Applied on top of all above | Green-tinted amplification | Reveals what's below the waterline |
| Smart glasses Infrared | Applied on top of all above | Thermal spectrum | Shows heat variance — water is 3°C |
| Smart glasses Full Spectrum | Applied on top of all above | Distorted multicolor anomaly view | Slotsky signatures appear as faint geometric patterns on walls |

**Slotsky's lighting signature:** When Slotsky manipulates the lights, it does so in a specific pattern — three pulses (on-off-on-off-on-off), then silence. This is the "house rhythm." Characters learn to recognize it. Josh interprets it as faulty wiring until the fourth or fifth time.

---

## AUDIO LANDSCAPE — CANONICAL AMBIENT SOUND

The chamber has a defined audio environment. ⛔ **NOTE: Lyria 3 procedural soundtrack is deferred to roadmap (see AGENTS.md Section 9 invariant). Static ambient audio files are used for the contest demo.**

> **ACTIVE FOR DEMO:** Static ambient sounds (drip, hum, voicebox static, distant voices) + all Slotsky reactive event triggers
> **DEFERRED TO ROADMAP:** Lyria 3 dynamic track generation, crossfade mixer, intensity ramp — see ROADMAP section at end of document

### Static Ambient (always present)
- **Water drip** — slow, irregular, from multiple points in the ceiling. The baseline safe sound.
- **Low structural hum** — the building above is still alive. Ventilation, electrical, distant machinery.
- **Distant voices** — Audrey and Josh, muffled and echoing, from other sections of the chamber. Technically from their ECHO proximity zones.
- **Voicebox static** — a faint background static from Jason's device, occasionally pulsing

### Reactive Ambient (state-triggered)
- **Tesla tire track wall:** The multimeter clicks continuously near this wall. No other sound.
- **Slotsky bell event:** A full slot-machine jackpot sound — three bells, coin-pour cascade — emanating from no identifiable direction. Then silence.
- **Playing card materialization:** No sound. The silence after a card appears is deeper than the baseline silence.
- **Water disturbance:** When something moves in the deep pool section, the water displaces in slow rings. The first time this happens with no visible cause is one of the game's most effective horror beats.
- **FOUND state trigger:** All ambient sound cuts for 8 seconds. Then the water sound from the Nature Vault rises — vast, moving, coming from directly below. It is beautiful. It is wrong.

---

## SLOTSKY IN THIS SPACE

The chamber is Slotsky's primary territory in Act 1. Its influence is felt rather than seen:

- The **Tesla tire tracks into the wall** are Slotsky's most visible physical evidence — a path probability couldn't complete
- The **playing cards** materialize in the park zones specifically — found on the shore, arranged on waterlogged steps, floating face-up in the shallows
- The **reflections** in the water are slightly wrong by Slotsky's design — the geometry below doesn't match what's above. This is not a visual glitch. This is an accurate reflection of what's actually below.
- When `slotsky_trigger: anomaly_geometry` fires: a door or passage that Jason identified earlier is simply no longer there. The wall is seamless. It was always seamless.

---

## WHAT IS VISIBLE FROM THE DEEP POOL (ACT 2 SEED)

Through the still dark water of the deep pool section, **with Night Vision or Full Spectrum active** (⛔ **DEFERRED — requires smart glasses HUD frontend implementation**), the player can glimpse what is below:

- Continuation of the water park infrastructure — more slides, a deeper pool basin
- And below that: **not concrete**. Something natural. Stone. Wide. Opening downward.
- This is the first glimpse of the **Nature Vault** (Layer 3). It is not accessible in Act 1.
- Jason will describe it: *"There's... I can see further down. Like it opens up. That's not construction. That's not— that's natural rock."*
- This is the final image before the prototype ends.

---

## AI GENERATION PROMPTS — ACTIVE FOR IMAGEN 3 (Contest Demo, March 2026)

> ✅ These prompts are **active for the contest demo**. They are used directly as Imagen 3 generation inputs when the Game Master writes a matching `scene_key` to Firestore.
> Use these prompts verbatim. Do not modify without updating Gamemaster.md scene routing.
> These were the canonical AI generation reference and remain authoritative — the only change is that they now drive live Imagen 3 calls instead of a pre-generated FMV library.

### For Tunnel Entry Zone (zone_tunnel_entry)
<!-- [AI: 'cracked smart-glasses POV overlay' removed from prompt — smart glasses CSS overlay is handled on frontend. Prompt rewritten to first-person POV anchored to brutalist concrete aesthetic. Original: 'cracked smart-glasses POV overlay, analog horror lo-fi grain, no people visible except character'] -->
```
First-person POV standing inside an unfinished Boring Company tunnel, looking ahead
down the white smooth-concrete cylinder, precast segmented ring walls with diagonal
bolt-plate seams, cold LED strip lighting along ceiling (flickering), concrete dust
on floor, tire tracks pressed into the dust leading into the far wall and stopping,
no people, photorealistic architectural photography, wide angle 16mm, brutalist
concrete, desaturated cool palette, mist in mid-air, cinematic horror, 8K
```

### For Water Park Shore Zone (zone_park_shore)
<!-- [AI: 'cracked smart-glasses POV overlay' removed from prompt — smart glasses CSS overlay is handled on frontend. Prompt rewritten to first-person POV anchored to brutalist concrete aesthetic, consistent with reference images. Original: 'cracked smart-glasses POV overlay, analog horror grain'] -->
```
First-person POV standing at the edge of an underground abandoned water park,
looking out across a vast subterranean chamber, brutalist exposed concrete arched
ribbed ceiling rising to 40 feet, warm orange flood construction lights on tripod
stands casting pools of amber glow, still dark water covering the concrete floor,
half-submerged fiberglass water slides in faded primary colors (red, yellow, blue)
receding into the dark water, perfect mirror reflection in still water creating
a doubled downward space, reflections geometrically wrong, no people,
photorealistic architectural photography, wide angle 16mm, desaturated cool-warm
contrast palette, cinematic horror, 8K
```

### For Slotsky Card Anomaly
<!-- [AI: 'POV cracked-glasses overlay' removed from prompt — smart glasses CSS overlay is handled on frontend. Prompt rewritten to first-person POV. Original: 'POV cracked-glasses overlay, stillness'] -->
```
First-person POV looking down at an underground water park floor, shallow dark water
over wet concrete, three playing cards arranged in a deliberate triangular pattern
(queen of spades, jack of clubs, ace of hearts) lying flat on the floor, no one near
them, single warm flood construction light casting a hard shadow from the right,
the cards were not there before, photorealistic, wide angle 24mm, brutalist concrete
and still water, desaturated with amber light accent, cinematic horror, 8K
```

---

## PHYSICAL CONDITION NOTES (CHARACTER BEHAVIOR REFERENCE)

- The concrete floor of the tunnel is safe to walk on. The water park floor is safe to wade in (up to shallows depth).
- The **deep pool sections** are not safe to enter — unknown depth, unknown floor condition, and the reflection issue means orientation is compromised.
- The **slides** are structurally uncertain — some are stable above water, some are not. Jason will say so if asked to climb one.
- The temperature in the chamber is cold — approximately 58°F / 14°C. Characters note this. The water is significantly colder (3°C by multimeter temperature gun reading).
- There is no cell signal. There is no WiFi. The voicebox is the only communication device, and it is receiving signals it was never designed to receive.

---

*TUNNEL-AND-PARK.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Last Updated: March 7, 2026 | Version 1.2 — Demo Scope Revision*
*Canon. Cross-reference WORLD_BIBLE.md v1.2 | Gamemaster.md v1.3*

---

## ─── ROADMAP / DEPRECATED — Preserved for Future Development ───

> All content below is **deprecated from the contest demo scope** as of March 7, 2026.
> Preserved for Act 2+ development. Do not implement for contest build.

<!-- DEPRECATED [LYRIA3]: Lyria 3 procedural soundtrack
     Reason: `docs/AUDIO_DESIGN.md` has not been created. Implementation cannot
     begin without that document (AGENTS.md Section 9 invariant).
     The audio landscape spec above (drip, hum, reactive triggers) describes the
     static ambient baseline that IS active in the demo.
     Lyria 3 layers ON TOP of that baseline with dynamic intensity ramps.
     Restore: Create docs/AUDIO_DESIGN.md. Implement per that spec only.
     Do not implement Lyria 3 even after contest without the AUDIO_DESIGN doc. -->

### Lyria 3 Audio Integration (Roadmap)
The audio landscape section above defines the full ambient sound spec.
Lyria 3 adds dynamic intensity ramp behavior on top of the static baseline.
Implement only after `docs/AUDIO_DESIGN.md` is created and approved.

---

<!-- DEPRECATED [GLASSES]: Night Vision / Full Spectrum deep pool visibility
     Reason: NV and FS filter modes require smart glasses HUD frontend.
     The deep pool Act 2 seed (glimpse of Nature Vault through NV/FS active)
     is an important story beat that sets up Layer 3 content.
     In the contest demo, the deep pool is simply described as "dark, deep, dangerous."
     Jason does not describe what’s below it without NV/FS active.
     Restore: With smart glasses frontend restoration (see Backpack.md). -->

### Deep Pool Night Vision Reveal (Roadmap)
Full spec preserved in the `## WHAT IS VISIBLE FROM THE DEEP POOL (ACT 2 SEED)` section above.
Triggered by NV or FS filter activation. This is the final image of Act 1.

---

<!-- DEPRECATED [BACKPACK]: Multimeter Slotsky detection readings
     Reason: Multimeter requires backpack system + Jason’s production prompt.
     The multimeter behavior near the Tesla wall and near playing card arrangements
     (anomalous readings, infinite voltage) is a canon mechanic.
     The behavior is described in Backpack.md item spec (item #4).
     Restore: With backpack system restoration (see Backpack.md). -->
