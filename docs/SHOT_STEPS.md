# SHOT_STEPS.md — Liminal Sin Act 1 Step Reference

## Version 1.0 | March 14, 2026

> **Single source of truth for step sequencing, scene keys, media IDs, and the backend step machine.**
> This file was extracted from `SHOT_SCRIPT.md`. Content is migrated as-is and marked where bugs/inconsistencies are known.
> Cross-reference: `SHOT_SCRIPT.md` | `AGENTS.md` | `server/services/stepMachine.ts` | `server/services/gameMaster.ts`

---

## ⚠️ KNOWN ISSUES (unresolved — pending review)

- **Media Filename Registry timeout values** are partially stale (e.g. `tunnel_darkness_01` still shows `22s`; `card_pickup_01` still shows `25s`). Authoritative runtime values live in `server/services/stepMachine.ts → STEP_MEDIA_TRIGGER`.
- The Step Machine Registry is authoritative. Always cross-check against `stepMachine.ts` if divergence is suspected.
- **`shaft_maintenance_01` and `maintenance_reveal_01`** are both clip-only steps (no `.png` still required). Neither file needs a still — they auto-chain into the `elevator_entry_01` still hold.

---

## SCENE KEY REGISTRY

All scene keys used in this script. Scene keys resolve to Morphic media IDs via `resolveMediaId()` in `gameMaster.ts`. Scripted scenes are served from pre-built Morphic files hosted on GCS (`gs://liminal-sin-assets`). Live generation keys are marked explicitly.

| Key                          | Morphic media_id         | Phase    | Source          | Notes                                                  |
| ---------------------------- | ------------------------ | -------- | --------------- | ------------------------------------------------------ |
| `tunnel_darkness_01`         | `tunnel_darkness_01`     | Phase 2  | Morphic (GCS)   | Pre-session darkness hold — muted                      |
| `flashlight_beam`            | `tunnel_flashlight_01`   | Phase 5  | Morphic (GCS)   | First visual moment                                    |
| `generator_area_start`       | `tunnel_generator_01`    | Phase 5B | Morphic (GCS)   | Generator area first discovered                        |
| `generator_area_operational` | `tunnel_generator_01`    | Phase 5B | Morphic (GCS)   | Same Morphic file as `generator_area_start`             |
| `generator_card_reveal`      | `card_joker_01`          | Phase 5B | Morphic (GCS)   | Joker card visible near generator                      |
| `card1_pickup_pov`           | `card_pickup_01`         | Phase 5B | Morphic (GCS)   | Joker card pickup; no close-up                         |
| `acecard_reveal_01`          | `acecard_reveal_01`      | Phase 5B | Morphic (GCS)   | Clip-only (no still); placement TBD                    |
| `wildcard_vision_feed`       | _(live gen)_             | Phase 5C | Live Imagen+Veo | Live anomaly image/video from player camera            |
| `tunnel_to_park_transition`  | `tunnel_transition_01`   | Phase 6  | Morphic (GCS)   | Tunnel-to-park push                                    |
| `park_transition_reveal`     | `park_reveal_01`         | Phase 6  | Morphic (GCS)   | Threshold between tunnel and paradise                  |
| `park_entrance`              | `park_walkway_01`        | Phase 6A | Morphic (GCS)   | Full waterpark reveal                                  |
| `park_walkway`               | `park_walkway_02`        | Phase 6B | Morphic (GCS)   | Jason exploring walkways                               |
| `park_liminal`               | `park_liminal_01`        | Phase 6B | Morphic (GCS)   | Liminal park transition beat                           |
| `park_shaft_view`            | `shaft_maintenance_01`   | Phase 6C | Morphic (GCS)   | Clip-only — auto-chains from `maintenance_reveal_01` into `elevator_entry_01` STILL |
| `maintenance_entry`          | `elevator_entry_01`      | Phase 7  | Morphic (GCS)   | Elevator entry — STILL hold after shaft clip chain                 |
| `elevator_inside`            | `elevator_inside_01`     | Phase 7  | Morphic (GCS)   | Elevator interior first view                           |
| `elevator_inside_2`          | `elevator_inside_02`     | Phase 7  | Morphic (GCS)   | Elevator interior continued                            |
| `maintenance_panel`          | `hallway_pov_01`         | Phase 7  | Morphic (GCS)   | Hallway POV — panel area                               |
| `hallway_pov_02`             | `hallway_pov_02`         | Phase 7  | Morphic (GCS)   | Prewarm anchor for wildcard2/3 preparation             |
| `card2_pickup_pov`           | `card_pickup_02`         | Phase 8  | Morphic (GCS)   | Final card pickup; no close-up                         |
| `wildcard_game_over`         | `maintenance_reveal_01`  | Phase 7B | Partial Morphic | `maintenance_reveal_01.mp4` exists (clip only, no still). Served from GCS. |
| `wildcard_good_ending`       | _(live gen)_             | Phase 8  | Live Imagen+Veo | Live image-to-video wildcard branch for good ending    |

---

## ACT 1 MEDIA REGISTRY — AUTHORITATIVE

The canonical Act 1 media plan:

- **16 pre-built stills** (Morphic — hosted on GCS `gs://liminal-sin-assets/stills/`)
- **18 pre-built clips** (Morphic — hosted on GCS `gs://liminal-sin-assets/clips/`)
- **2 live wildcard images** (Imagen 4 img2img — `wildcard_vision_feed`, `wildcard_good_ending`)
- **2–3 live wildcard videos** (Veo 3.1 img2vid — `wildcard_vision_feed`, `wildcard_game_over` if not using disk override, `wildcard_good_ending`)

### Hard Invariants

- All scenes, images, and videos are **16:9, high-quality, photorealistic, cinematic**.
- Everything is **Jason's first-person POV**.
- **No close-up shots** are allowed anywhere in Act 1.
- Darkness phase has **zero visual generations**. Screen remains black until flashlight activation.
- Jason must not be given environmental visual knowledge before flashlight activation.
- All scripted stills and clips are pre-built Morphic files hosted on GCS. No Imagen or Veo calls are made for scripted scenes.
- The Morphic pipeline was constructed so that each still is conceptually the last frame extracted from the previous scripted video. At runtime the backend simply serves the next file in sequence.
- The missing `v5` is intentional. That slot is replaced by the **live wildcard smartglasses anomaly video**.
- Every still-frame gameplay node has a **per-step timeout** (see Step Machine Registry below). Timeout consequence is auto-advance for exploration steps, and `game_over` for the card2 beat.
- Every idle still-frame node also supports **9-second NPC idle nudge** so Jason can talk to himself, call for Audrey/Josh, or address the player if the player remains silent. Urgency escalates after 18s silence.
- The Boring tunnel remains the active environment through the full generator sequence. The waterpark does not appear until after the wildcard interruption and the tunnel-to-park transition.

### Canonical Sequencing

| Order | Scene Key                  | Morphic media_id         | Meaning                                                               |
| ----- | -------------------------- | ------------------------ | --------------------------------------------------------------------- |
| 0     | `tunnel_darkness_01`       | `tunnel_darkness_01`     | Pre-session darkness hold (muted)                                     |
| 1     | `flashlight_beam`          | `tunnel_flashlight_01`   | Flashlight turns on; Jason gets bearings in darkness                   |
| 2     | `generator_area_start`     | `tunnel_generator_01`    | Generator area first discovered                                       |
| 3     | `generator_area_operational` | `tunnel_generator_01`  | Generator area stabilized; same Morphic file as above                 |
| 4     | `generator_card_reveal`    | `card_joker_01`          | Joker card now visible near generator base                            |
| 5     | `card1_pickup_pov`         | `card_pickup_01`         | Joker card pickup video; no close-up                                  |
| 6     | `wildcard_vision_feed`     | _(live gen)_             | Live smartglasses anomaly built from player camera extraction          |
| 7     | `tunnel_to_park_transition` | `tunnel_transition_01`  | Jason explores forward from the Boring tunnel after wildcard resolves  |
| 8     | `park_transition_reveal`   | `park_reveal_01`         | Reveal hold between tunnel and paradise park                          |
| 9     | `park_entrance`            | `park_walkway_01`        | Perfect waterpark crashed into boring tunnel                          |
| 10    | `park_walkway`             | `park_walkway_02`        | Jason exploring massive walkways between water features               |
| 11    | `park_liminal`             | `park_liminal_01`        | Liminal park transition beat                                          |
| 12    | `park_shaft_view`          | `shaft_maintenance_01`   | Clip-only auto-chain — no STILL hold; chains from maintenance_reveal_01         |
| 13    | `maintenance_entry`        | `elevator_entry_01`      | STILL hold after shaft clip chain — Jason commits to elevator path              |
| 14    | `elevator_inside`          | `elevator_inside_01`     | Elevator interior first view                                          |
| 15    | `elevator_inside_2`        | `elevator_inside_02`     | Elevator interior continued                                           |
| 16    | `maintenance_panel`        | `hallway_pov_01`         | Hallway POV — panel area                                              |
| 17    | `hallway_pov_02`           | `hallway_pov_02`         | Prewarm anchor — wildcard2/3 background preparation begins here       |
| 18    | `card2_pickup_pov`         | `card_pickup_02`         | Final card pickup / collection; no close-up                           |
| 19    | `wildcard_game_over`       | `maintenance_reveal_01`  | Bad-ending branch (served from GCS Morphic clip)                  |
| 20    | `wildcard_good_ending`     | _(live gen)_             | Live anomaly good-ending branch                                       |

### Media Filename Registry (Morphic Import)

Use basename as trigger id. Frontend resolves stills and clips via GCS:
- Stills: `https://storage.googleapis.com/liminal-sin-assets/stills/<media_id>.png`
- Clips: `https://storage.googleapis.com/liminal-sin-assets/clips/<media_id>.mp4`

> **Note:** `generator_area_start` and `generator_area_operational` both resolve to the same Morphic file (`tunnel_generator_01`).
> **⚠️ Timeout values here may be stale.** Authoritative runtime timeouts live in `server/services/stepMachine.ts → STEP_MEDIA_TRIGGER`.

| media_id                | still filename             | clip filename               | trigger type   | audio mode   | timeout seconds |
| ----------------------- | -------------------------- | --------------------------- | -------------- | ------------ | --------------- |
| `tunnel_darkness_01`    | `tunnel_darkness_01.png`   | `tunnel_darkness_01.mp4`    | hold_for_input | muted        | 22              |
| `tunnel_flashlight_01`  | `tunnel_flashlight_01.png` | `tunnel_flashlight_01.mp4`  | chained_auto   | native_audio | 30              |
| `tunnel_generator_01`   | `tunnel_generator_01.png`  | `tunnel_generator_01.mp4`   | hold_for_input (last) | native_audio | 30              |
| `card_joker_01`         | `card_joker_01.png`        | `card_joker_01.mp4`         | hold_for_input | native_audio | 30              |
| `card_pickup_01`        | `card_pickup_01.png`       | `card_pickup_01.mp4`        | chained_auto   | native_audio | 25              |
| `acecard_reveal_01`     | n/a                        | `acecard_reveal_01.mp4`     | conditional    | native_audio | —               |
| `card_pickup_02`        | `card_pickup_02.png`       | `card_pickup_02.mp4`        | hold_for_input | native_audio | 15              |
| `tunnel_transition_01`  | `tunnel_transition_01.png` | `tunnel_transition_01.mp4`  | hold_for_input | native_audio | 30              |
| `park_reveal_01`        | `park_reveal_01.png`       | `park_reveal_01.mp4`        | chained_auto   | native_audio | 30              |
| `park_walkway_01`       | `park_walkway_01.png`      | `park_walkway_01.mp4`       | chained_auto   | native_audio | 30              |
| `park_walkway_02`       | `park_walkway_02.png`      | `park_walkway_02.mp4`       | chained_auto   | native_audio | 30              |
| `park_liminal_01`       | `park_liminal_01.png`      | `park_liminal_01.mp4`       | hold_for_input | native_audio | 30              |
| `maintenance_reveal_01` | n/a — clip only            | `maintenance_reveal_01.mp4` | chained_auto   | native_audio | 30              |
| `shaft_maintenance_01`  | n/a — clip only            | `shaft_maintenance_01.mp4`  | chained_auto   | native_audio | 30              |
| `elevator_entry_01`     | `elevator_entry_01.png`    | `elevator_entry_01.mp4`     | hold_for_input | native_audio | 30              |
| `elevator_inside_01`    | `elevator_inside_01.png`   | `elevator_inside_01.mp4`    | chained_auto   | native_audio | 30              |
| `elevator_inside_02`    | `elevator_inside_02.png`   | `elevator_inside_02.mp4`    | chained_auto   | native_audio | 30              |
| `hallway_pov_01`        | `hallway_pov_01.png`       | `hallway_pov_01.mp4`        | chained_auto   | native_audio | 30              |
| `hallway_pov_02`        | `hallway_pov_02.png`       | n/a                         | hold_for_input | native_audio | 30              |

### Darkness-Phase Rule

The Darkness Scene includes no generated stills or videos. Before TALK opens and before flashlight activation:

- Jason is injured, alone, and in pitch blackness.
- He can call for Audrey and Josh.
- He can report only sound, touch-level sensation, pain, breath, and spatial echo.
- He must not describe tunnels, slides, maintenance shafts, pools, waterpark structures, cards, or lights.

### Wildcard Event Rules

- `wildcard_vision_feed` is a live fourth-wall anomaly event and follows this exact backend flow:
  1. Backend captures a still frame from the player's camera.
  2. Imagen performs **image-to-image editing** on that still, preserving the player's room and position while adding a shadowy figure beside or behind them.
  3. Veo performs **image-to-video** generation from that edited frame.
  4. Wildcard video duration is **8 seconds**.
  5. HUD borders and small-frame feed presentation are **frontend CSS effects**, not baked into the generated media.
  6. Prompt language must avoid direct keywords like `horror` or `monster`.
- Wildcard timing rule: the full `wildcard_vision_feed` production pipeline — Live AI webcam capture → Imagen img2img shadow injection → Veo img2vid animation — takes approximately **90 seconds** end-to-end. Backend must begin preparation at least 90 seconds before the intended card-discovery/payoff moment, hold the finished asset server-side, and trigger playback immediately when the card collection beat resolves.
- Wildcard playback flow is canonical:
  1. glitch transition
  2. dark screen / light screen noise hold
  3. Jason says: "There's a feed coming in through my glasses. I did not activate this myself."
  4. video plays in a small frame with frontend CSS HUD border
  5. scare SFX triggers with video
  6. glitch transition
  7. cut to next scene
- `wildcard_game_over` is the bad-ending branch. **Partial Morphic override:** `maintenance_reveal_01.mp4` exists on disk (clip only, no still). Currently served from disk for speed and determinism.
- `wildcard_good_ending` is a live image-to-video wildcard branch used only after card2 pickup resolves.
- Wildcard prewarm guardrail (mandatory):
  1. At `hallway_pov_02` still activation, backend begins background preparation for BOTH `wildcard_game_over` and `wildcard_good_ending`.
  2. Backend re-attempts prewarm at +90s if either wildcard branch is still not ready.
  3. Card2 click path must consume prewarmed `wildcard_good_ending` before emitting `good_ending`.
  4. Dread timer expiry path must consume prewarmed `wildcard_game_over` before emitting `game_over`.
  5. While wildcard2/3 media is still loading, backend emits `slotsky_trigger` loading markers (`wildcard_game_over_loading`, `wildcard_good_ending_loading`) and frontend must run CSS glitch/loading effects until `scene_video` arrives.
  6. For wildcard2/3 video prompts, enforce: no music, natural ambient sounds only.

### Waterpark Rule

The waterpark is a **functional paradise**. It is liminal, perfect, immense, and operational. It is not abandoned, rotted, ruined, wasted, flooded-out, or dead. Prompt language must preserve that distinction.

---

## STEP MACHINE REGISTRY

Documents the backend step sequencer. This is the authoritative step execution table — cross-check against `server/services/stepMachine.ts → STEP_MEDIA_TRIGGER` and `STEP_AUTOPLAY_ACTIONS` for live runtime values.

The autoplay advance chain maps `fromStep → toStep` for inactivity-driven progression through the experience.

> ⚠️ This table is the authoritative reference. Cross-check against `server/services/stepMachine.ts → STEP_MEDIA_TRIGGER` and `STEP_AUTOPLAY_ACTIONS`.
> **WILDCARD2** (`hallway_pov_02` and `acecard_reveal` stage) is now **frontend CSS/SFX only** — no backend video generation.

| Step | Scene Key                    | media_id                | Timeout | Trigger Type     | On Timeout / Action                          |
| ---- | ---------------------------- | ----------------------- | ------- | ---------------- | -------------------------------------------- |
| 7    | `flashlight_beam`            | `tunnel_flashlight_01`  | 30s     | chained_auto     | auto-advance → 9                             |
| 9    | `generator_area_start`       | `tunnel_generator_01`   | 30s     | chained_auto     | auto-advance → 11                            |
| 11   | `generator_area_operational` | `tunnel_generator_01`   | 30s     | hold_for_input   | auto-advance → 13                            |
| 13   | `generator_card_reveal`      | `card_joker_01`         | 30s     | hold_for_input   | auto-collect card1 → wildcard1               |
| —    | `card1_pickup_pov`           | `card_pickup_01`        | 25s     | chained_auto     | → wildcard1 pipeline                         |
| —    | `wildcard_vision_feed`       | _(live gen)_            | 15s     | hold_for_input   | → step 17                                    |
| 17   | `tunnel_to_park_transition`  | `tunnel_transition_01`  | 30s     | hold_for_input   | STILL hold at start; advance → 19            |
| 19   | `park_transition_reveal`     | `park_reveal_01`        | 30s     | chained_auto     | auto-advance → 21                            |
| 21   | `park_entrance`              | `park_walkway_01`       | 30s     | chained_auto     | auto-advance → 23                            |
| 23   | `park_walkway`               | `park_walkway_02`       | 30s     | chained_auto     | auto-advance → 24                            |
| 24   | `park_liminal`               | `park_liminal_01`       | 30s     | hold_for_input   | STILL hold; advance → 25                     |
| 25   | _(corridor approach)_        | `maintenance_reveal_01` | 30s     | chained_auto     | clip-only chain → 26                         |
| 26   | `park_shaft_view`            | `shaft_maintenance_01`  | 30s     | chained_auto     | clip-only chain → 27                         |
| 27   | `maintenance_entry`          | `elevator_entry_01`     | 30s     | hold_for_input   | STILL hold; advance → 28                     |
| 28   | `elevator_inside`            | `elevator_inside_01`    | 30s     | chained_auto     | auto-advance → 29                            |
| 29   | `elevator_inside_2`          | `elevator_inside_02`    | 30s     | chained_auto     | auto-advance → 30                            |
| 30   | `maintenance_panel`          | `hallway_pov_01`        | 30s     | chained_auto     | fires dread timer + card2 + acecard → 31     |
| 31   | `hallway_pov_02`             | `hallway_pov_02`        | 30s     | hold_for_input   | STILL + game_over timer; acecard keyword gate |
| —    | `acecard_reveal`             | `acecard_reveal_01`     | —       | conditional (GM) | clip → `card_pickup_02` still                |
| —    | `card2_pickup_pov`           | `card_pickup_02`        | 15s     | hold_for_input   | STILL + urgent game_over timer; collect → good_ending |
| —    | `wildcard_game_over`         | `maintenance_reveal_01` | 8s      | hold_for_input   | → `game_over` (frontend CSS/SFX — WILDCARD2) |
| —    | `wildcard_good_ending`       | _(live gen)_            | 8s      | hold_for_input   | → `good_ending` (WILDCARD3)                  |

---

_SHOT_STEPS.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 1.0 | March 14, 2026_
_Canon. Cross-reference: SHOT_SCRIPT.md | AGENTS.md | server/services/stepMachine.ts | server/services/gameMaster.ts_
