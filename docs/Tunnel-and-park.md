# TUNNEL-AND-PARK.md — The Chamber
## Act 1 Environment Bible: The Boring Tunnel / Water Park Merge
### Version 1.1 | Day 3 — February 25, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 Section 2 (Layer 1) | Backpack.md v1.0
### Status: PRODUCTION CANON — AI generation reference + atmosphere specification

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

The chamber has a defined audio environment that the Lyria 3 procedural soundtrack layers over:

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

Through the still dark water of the deep pool section, with Night Vision or Full Spectrum active, the player can glimpse what is below:

- Continuation of the water park infrastructure — more slides, a deeper pool basin
- And below that: **not concrete**. Something natural. Stone. Wide. Opening downward.
- This is the first glimpse of the **Nature Vault** (Layer 3). It is not accessible in Act 1.
- Jason will describe it: *"There's... I can see further down. Like it opens up. That's not construction. That's not— that's natural rock."*
- This is the final image before the prototype ends.

---

## AI GENERATION PROMPTS — CANONICAL REFERENCE

### For Tunnel Entry Zone (zone_tunnel_entry)
```
Interior of an unfinished Boring Company tunnel, white smooth concrete cylinder,
circular cross-section, cold white LED strip lighting along ceiling (some flickering),
concrete dust on floor, tire tracks in dust leading toward solid wall and stopping,
lone figure in foreground on ground, cracked smart-glasses POV overlay,
analog horror lo-fi grain, no people visible except character
```

### For Water Park Shore Zone (zone_park_shore)
```
Underground abandoned water park, vast concrete chamber, warm orange flood
construction lights on tripod stands, still dark water covering floor,
half-submerged fiberglass water slides in faded primary colors (red yellow blue),
perfect mirror reflection in water creating doubled downward space, reflections
slightly geometrically wrong, cracked smart-glasses POV overlay, analog horror grain
```

### For Slotsky Card Anomaly
```
Underground water park floor, shallow dark water, three playing cards arranged in
a deliberate pattern on the wet concrete (queen of spades, jack of clubs, ace of hearts),
no one near them, flood light casting hard shadow, the cards were not there before,
analog horror grain, POV cracked-glasses overlay, stillness
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
*Last Updated: Day 3 — February 25, 2026 | Version 1.1*
*Canon. Cross-reference WORLD_BIBLE.md v1.1 | Backpack.md v1.0*
