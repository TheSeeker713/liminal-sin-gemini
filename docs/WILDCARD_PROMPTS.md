# WILDCARD_PROMPTS.md — Liminal Sin Appendices

## Version 3.0 | March 15, 2026

> Extracted from SHOT_SCRIPT.md. Contains Imagen 4 prompts, Veo 3.1 animation hints, prewarm cache targets, card collectibles spec, and step machine pointer.

---

## APPENDIX A — IMAGEN 4 PROMPTS (WILDCARD LIVE-GENERATION ONLY)

> Only wildcard live-generation prompts are listed here. All scripted scene imagery is served from pre-built Morphic files in `assets/generated_stills/`. The original Imagen 4 prompts for scripted scenes (`flashlight_beam`, `generator_area`, `zone_park_shore`, `maintenance_area`, `card2_closeup`) are preserved in `imagen.ts` as historical reference only. They are NOT active at runtime.

---

### `wildcard_vision_feed`

```
First-person POV through a slightly distorted smartglasses HUD, the player's real
room visible as photographed but with a tall thin shadowy human-shaped figure standing
just behind/beside them, figure partially translucent with hard shadow edges as if
lit by a screen, no face visible, stance unnaturally still, the figure does not
interact with the environment — it simply watches, subtle chromatic aberration at
frame edges, photorealistic with minor digital compression artifacts, wide angle
lens distortion, 8K
```

---

### `wildcard_game_over`

> **Note:** This will not be an imagen prompt anymore. instead it will be a frontend triggered event with sound fx, css animations that cover the entire screen, with noise distortion and red tinting, then fade to black with a scream sfx. Then a "Game Over, Thank you for Playing. a [play again] button fades in with a [quit game] button.
---

### `wildcard_good_ending`

```
First-person POV standing at the edge of the vast underground waterpark, neon lights
reflecting in the still dark water, but the space feels different now — warmer,
the foliage less bleached, a distant figure (Audrey) barely visible at the far end
of the main pool walkway, her posture suggests she has just turned toward the camera,
the aquamarine glow from the pool below illuminates the mist between them, no threat,
no horror — just distance and hope and the enormity of the space between two people,
photorealistic, wide angle 16mm, cinematic, warm neon palette, 8K
```

---

## APPENDIX B — VEO 3.1 FAST ANIMATION HINTS (WILDCARD LIVE-GENERATION ONLY)

> Only wildcard live-generation animation hints are listed here. All scripted scene clips are served from pre-built Morphic files in `assets/generated_clips/`. The original Veo animation hints for scripted scenes are preserved in `veo.ts` as historical reference only. They are NOT active at runtime.

---

### `wildcard_vision_feed`

```
The shadowy figure behind/beside the player shifts weight almost imperceptibly,
the room's lighting flickers once as if a bulb is dying, the figure's outline
ripples with subtle chromatic distortion, the player in the foreground does not
react — only the viewer sees the movement, duration 8 seconds, no sudden cuts,
slow dread energy
```

---

### `wildcard_game_over`

> **Note:** If `maintenance_reveal_01.mp4` is served from disk, this hint is not used at runtime.

```
Emergency red lights begin strobing irregularly, the open door at the corridor end
yawns wider as if the blackness beyond it is expanding, the crushed queen of spades
card on the floor is caught in a draft and slides an inch toward the door, a single
pipe along the ceiling drips faster, the sense of something having just moved through
intensifies, 8 seconds, no sudden cuts, building claustrophobic tension
```

---

### `wildcard_good_ending`

```
Slow push-in toward the distant figure (Audrey) at the far end of the waterpark
walkway, neon reflections in the water ripple gently as if stirred by unseen current,
the mist between the camera and Audrey thins slightly revealing more of her silhouette,
she takes one small step forward, the aquamarine glow brightens almost imperceptibly,
8 seconds, no sudden movement, hope energy
```

---

## APPENDIX C — PREWARM CACHE TARGET

### Morphic Files — Instant Serve

`PREWARM_SCENE_KEYS` in `server/services/imagen.ts` pre-loads these 3 Morphic stills into memory at session start for instant delivery:

| Scene Key            | Morphic media_id         | Morphic File                |
|----------------------|--------------------------|-----------------------------|
| `flashlight_beam`    | `tunnel_flashlight_01`   | `tunnel_flashlight_01.png`  |
| `generator_area_start` | `tunnel_generator_01`  | `tunnel_generator_01.png`   |
| `park_entrance`      | `park_walkway_01`        | `park_walkway_01.png`       |

### Wildcard Prewarm — Live Generation (~90s Budget)

| Wildcard Key            | Trigger Point                            | Pipeline                    |
|-------------------------|------------------------------------------|-----------------------------|
| `wildcard_vision_feed`  | First `player_frame` after `jasonReadyForPlayer` gates open | Imagen img2img → Veo img2vid |
| `wildcard_game_over`    | `hallway_pov_02_ready` signal from frontend (also triggers acecard keyword timer) | Imagen gen → Veo img2vid (or `maintenance_reveal_01.mp4` from disk) |
| `wildcard_good_ending`  | `hallway_pov_02_ready` signal from frontend (also triggers acecard keyword timer) | Imagen gen → Veo img2vid    |

Backend re-attempts both `wildcard_game_over` and `wildcard_good_ending` prewarms at +90s as a safety pass.

---

## APPENDIX D — CARD COLLECTIBLES SPEC

| Card   | ID      | Visual          | Phase             | Contains                                            |
| ------ | ------- | --------------- | ----------------- | --------------------------------------------------- |
| Card 1 | `card1` | Joker           | Phase 5B (Beat 3) | AI vision proof — Jason describes player appearance |
| Card 2 | `card2` | Ace             | Phase 7B (Beat 7) | Session ending trigger — routes to good ending      |

Both cards are standard playing cards (same visual language as the `slotsky_card` three-card anomaly in Beat 5). The Joker card appears alone in the `generator_card_reveal` scene (`card_joker_01`), isolated in the flashlight spotlight. The Ace card appears as the floating collectible overlay on `card_pickup_02.png` after `acecard_reveal_01.mp4` plays at the hallway end. Player has 15 seconds to click the card overlay or voice-command Jason to grab it. Card collected → good ending. Timer expiry → game over.

---

## APPENDIX E — STEP MACHINE REGISTRY

→ **[SHOT_STEPS.md — Step Machine Registry](SHOT_STEPS.md)**

---

_WILDCARD_PROMPTS.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 3.0 | March 15, 2026_
_Canon. Cross-reference: SHOT_SCRIPT.md | LS_VIDEO_PIPELINE.md | AGENTS.md_
