# SHOT_SCRIPT.md — Liminal Sin Act 1 Director's Blueprint

## Version 2.0 | March 13, 2026

### Status: PRODUCTION — Morphic assets canonicalized, step machine documented

### Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md | imagen.ts | veo.ts

---

## OVERVIEW

This is the authoritative director's blueprint for the Liminal Sin Act 1 experience. It defines the complete game flow from onboarding through both possible endings, specifying scripted dialogue, SFX cues, scene keys, and WebSocket event sequences.

Scripted scenes are served from pre-built Morphic files on disk. Imagen 4 and Veo 3.1 are invoked **ONLY** for the 3 wildcard live-generation events (`wildcard_vision_feed`, `wildcard_game_over`, `wildcard_good_ending`).

**Architecture reference:**
| File | Purpose |
|---|---|
| `server/server.ts` | WS lifecycle, gate timers, step machine, intro_complete handler |
| `server/services/gameMaster.ts` | GM function call router, `resolveMediaId()` mapping |
| `server/services/gmTools.ts` | GM tool declarations for Gemini function calling |
| `server/services/imagen.ts` | Imagen 4 prompts — wildcard live-gen only; `ZONE_PROMPTS` dict (historical) |
| `server/services/veo.ts` | Veo 3.1 animation hints — wildcard live-gen only; `ANIMATION_HINTS` dict (historical) |
| `server/services/npc/jason.ts` | Jason NPC system prompt |
| `server/services/gemini.ts` | GM 6-beat playbook — `getGameMasterSystemPrompt()` |
| `assets/generated_stills/` | 16 canonical pre-built Morphic `.png` files |
| `assets/generated_clips/` | 18 canonical pre-built Morphic `.mp4` files |
| `myceliainteractive` (frontend) | UI, onboarding, card overlay, dread timer SFX |

**Hardcoded invariants (never violate):**

- All imagery is **Jason's first-person POV** — what Jason sees; never a third-person camera.
- The experience **never pauses**. No menus. No titles mid-session. No game-over UI that breaks tone.
- **No HUD, no backpack, no smart glasses UI overlay** — deferred to Act 2.
- The room starts in **total darkness**. No images generate until Beat 2 (flashlight moment).
- Voicebox lore → **smartglasses app** (affects `jason.ts` and `server.ts`; tracked as separate sprint).
- **Scripted media is never re-generated at runtime.** All scripted stills and clips are pre-built Morphic files served from disk.

---

## SCENE KEY REGISTRY

All scene keys used in this script. Scene keys resolve to Morphic media IDs via `resolveMediaId()` in `gameMaster.ts`. Scripted scenes are served from pre-built Morphic files. Live generation keys are marked explicitly.

| Key                          | Morphic media_id         | Phase    | Source          | Notes                                                  |
| ---------------------------- | ------------------------ | -------- | --------------- | ------------------------------------------------------ |
| `tunnel_darkness_01`         | `tunnel_darkness_01`     | Phase 2  | Morphic (disk)  | Pre-session darkness hold — muted                      |
| `flashlight_beam`            | `tunnel_flashlight_01`   | Phase 5  | Morphic (disk)  | First visual moment                                    |
| `generator_area_start`       | `tunnel_generator_01`    | Phase 5B | Morphic (disk)  | Generator area first discovered                        |
| `generator_area_operational` | `tunnel_generator_01`    | Phase 5B | Morphic (disk)  | Same Morphic file as `generator_area_start`             |
| `generator_card_reveal`      | `card_joker_01`          | Phase 5B | Morphic (disk)  | Joker card visible near generator                      |
| `card1_pickup_pov`           | `card_pickup_01`         | Phase 5B | Morphic (disk)  | Joker card pickup; no close-up                         |
| `acecard_reveal_01`          | `acecard_reveal_01`      | Phase 5B | Morphic (disk)  | Clip-only (no still); placement TBD                    |
| `wildcard_vision_feed`       | _(live gen)_             | Phase 5C | Live Imagen+Veo | Live anomaly image/video from player camera            |
| `tunnel_to_park_transition`  | `tunnel_transition_01`   | Phase 6  | Morphic (disk)  | Tunnel-to-park push                                    |
| `park_transition_reveal`     | `park_reveal_01`         | Phase 6  | Morphic (disk)  | Threshold between tunnel and paradise                  |
| `park_entrance`              | `park_walkway_01`        | Phase 6A | Morphic (disk)  | Full waterpark reveal                                  |
| `park_walkway`               | `park_walkway_02`        | Phase 6B | Morphic (disk)  | Jason exploring walkways                               |
| `park_liminal`               | `park_liminal_01`        | Phase 6B | Morphic (disk)  | Liminal park transition beat                           |
| `park_shaft_view`            | `shaft_maintenance_01`   | Phase 6C | Morphic (disk)  | Maintenance shaft visible in distance                  |
| `maintenance_entry`          | `elevator_entry_01`      | Phase 7  | Morphic (disk)  | Jason commits to maintenance path                      |
| `elevator_inside`            | `elevator_inside_01`     | Phase 7  | Morphic (disk)  | Elevator interior first view                           |
| `elevator_inside_2`          | `elevator_inside_02`     | Phase 7  | Morphic (disk)  | Elevator interior continued                            |
| `maintenance_panel`          | `hallway_pov_01`         | Phase 7  | Morphic (disk)  | Hallway POV — panel area                               |
| `hallway_pov_02`             | `hallway_pov_02`         | Phase 7  | Morphic (disk)  | Prewarm anchor for wildcard2/3 preparation             |
| `card2_pickup_pov`           | `card_pickup_02`         | Phase 8  | Morphic (disk)  | Final card pickup; no close-up                         |
| `wildcard_game_over`         | `maintenance_reveal_01`  | Phase 7B | Partial Morphic | `maintenance_reveal_01.mp4` exists (clip only, no still). Currently served from disk. |
| `wildcard_good_ending`       | _(live gen)_             | Phase 8  | Live Imagen+Veo | Live image-to-video wildcard branch for good ending    |

---

## ACT 1 MEDIA REGISTRY — AUTHORITATIVE

This section supersedes any earlier reduced 5-scene interpretation. The canonical Act 1 media plan is:

- **16 pre-built stills** (Morphic — `assets/generated_stills/`)
- **18 pre-built clips** (Morphic — `assets/generated_clips/`)
- **2 live wildcard images** (Imagen 4 img2img — `wildcard_vision_feed`, `wildcard_good_ending`)
- **2–3 live wildcard videos** (Veo 3.1 img2vid — `wildcard_vision_feed`, `wildcard_game_over` if not using disk override, `wildcard_good_ending`)

### Hard Invariants

- All scenes, images, and videos are **16:9, high-quality, photorealistic, cinematic**.
- Everything is **Jason's first-person POV**.
- **No close-up shots** are allowed anywhere in Act 1.
- Darkness phase has **zero visual generations**. Screen remains black until flashlight activation.
- Jason must not be given environmental visual knowledge before flashlight activation.
- All scripted stills and clips are pre-built Morphic files. No Imagen or Veo calls are made for scripted scenes.
- The Morphic pipeline was constructed so that each still is conceptually the last frame extracted from the previous scripted video. At runtime the backend simply serves the next file in sequence.
- The missing `v5` is intentional. That slot is replaced by the **live wildcard smartglasses anomaly video**.
- Every still-frame gameplay node has a **per-step timeout** (see Media Filename Registry below). Timeout consequence is auto-advance for exploration steps, and `game_over` for the card2 beat.
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
| 12    | `park_shaft_view`          | `shaft_maintenance_01`   | Maintenance shaft visible in distance from park                       |
| 13    | `maintenance_entry`        | `elevator_entry_01`      | Jason commits to maintenance path                                     |
| 14    | `elevator_inside`          | `elevator_inside_01`     | Elevator interior first view                                          |
| 15    | `elevator_inside_2`        | `elevator_inside_02`     | Elevator interior continued                                           |
| 16    | `maintenance_panel`        | `hallway_pov_01`         | Hallway POV — panel area                                              |
| 17    | `hallway_pov_02`           | `hallway_pov_02`         | Prewarm anchor — wildcard2/3 background preparation begins here       |
| 18    | `card2_pickup_pov`         | `card_pickup_02`         | Final card pickup / collection; no close-up                           |
| 19    | `wildcard_game_over`       | `maintenance_reveal_01`  | Bad-ending branch (served from Morphic clip on disk)                  |
| 20    | `wildcard_good_ending`     | _(live gen)_             | Live anomaly good-ending branch                                       |

### Media Filename Registry (Morphic Import)

Use basename as trigger id. Frontend resolves `.png` for hold frames and `.mp4` for clip playback.

> **Note:** `generator_area_start` and `generator_area_operational` both resolve to the same Morphic file (`tunnel_generator_01`).

| media_id                | still filename             | clip filename               | trigger type   | audio mode   | timeout seconds |
| ----------------------- | -------------------------- | --------------------------- | -------------- | ------------ | --------------- |
| `tunnel_darkness_01`    | `tunnel_darkness_01.png`   | `tunnel_darkness_01.mp4`    | hold_for_input | muted        | 22              |
| `tunnel_flashlight_01`  | `tunnel_flashlight_01.png` | `tunnel_flashlight_01.mp4`  | hold_for_input | native_audio | 30              |
| `tunnel_generator_01`   | `tunnel_generator_01.png`  | `tunnel_generator_01.mp4`   | chained_auto   | native_audio | 30              |
| `card_joker_01`         | `card_joker_01.png`        | `card_joker_01.mp4`         | hold_for_input | native_audio | 30              |
| `card_pickup_01`        | `card_pickup_01.png`       | `card_pickup_01.mp4`        | hold_for_input | native_audio | 25              |
| `acecard_reveal_01`     | n/a                        | `acecard_reveal_01.mp4`     | conditional    | native_audio | —               |
| `card_pickup_02`        | `card_pickup_02.png`       | `card_pickup_02.mp4`        | hold_for_input | native_audio | 15              |
| `tunnel_transition_01`  | `tunnel_transition_01.png` | `tunnel_transition_01.mp4`  | chained_auto   | native_audio | 30              |
| `park_reveal_01`        | `park_reveal_01.png`       | `park_reveal_01.mp4`        | chained_auto   | native_audio | 30              |
| `park_walkway_01`       | `park_walkway_01.png`      | `park_walkway_01.mp4`       | chained_auto   | native_audio | 30              |
| `park_walkway_02`       | `park_walkway_02.png`      | `park_walkway_02.mp4`       | chained_auto   | native_audio | 30              |
| `park_liminal_01`       | `park_liminal_01.png`      | `park_liminal_01.mp4`       | chained_auto   | native_audio | 30              |
| `shaft_maintenance_01`  | n/a                        | `shaft_maintenance_01.mp4`  | hold_for_input | native_audio | 30              |
| `elevator_entry_01`     | `elevator_entry_01.png`    | `elevator_entry_01.mp4`     | hold_for_input | native_audio | 15              |
| `elevator_inside_01`    | `elevator_inside_01.png`   | `elevator_inside_01.mp4`    | hold_for_input | native_audio | 30              |
| `elevator_inside_02`    | `elevator_inside_02.png`   | `elevator_inside_02.mp4`    | hold_for_input | native_audio | 30              |
| `hallway_pov_01`        | `hallway_pov_01.png`       | `hallway_pov_01.mp4`        | hold_for_input | native_audio | 15              |
| `hallway_pov_02`        | `hallway_pov_02.png`       | n/a                         | hold_for_input | native_audio | 30              |
| `maintenance_reveal_01` | n/a                        | `maintenance_reveal_01.mp4` | hold_for_input | native_audio | 15              |

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

## WS EVENT REGISTRY

Extends the contract defined in `CURRENT_STATE.md`.

| Event                  | Direction | Payload                                                                                                                                               | Status      |
| ---------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `intro_complete`       | FE→BE     | `{}`                                                                                                                                                  | ✅ Existing |
| `player_speech`        | FE→BE     | `{ audio: base64 }`                                                                                                                                   | ✅ Existing |
| `player_frame`         | FE→BE     | `{ jpeg: base64 }`                                                                                                                                    | ✅ Existing |
| `hallway_pov_02_ready` | FE→BE     | `{}`                                                                                                                                                  | ✅ Existing |
| `session_ready`        | BE→FE     | `{ session_id: string }`                                                                                                                              | ✅ Existing |
| `agent_speech`         | BE→FE     | `{ agent: 'jason'\|'audrey', audio: base64 }`                                                                                                         | ✅ Existing |
| `agent_interrupt`      | BE→FE     | `{ agent: 'jason' }`                                                                                                                                  | ✅ Existing |
| `trust_update`         | BE→FE     | `{ trust_level: number, fear_index: number }`                                                                                                         | ✅ Existing |
| `hud_glitch`           | BE→FE     | `{ intensity: string, duration_ms: number }`                                                                                                          | ✅ Existing |
| `scene_change`         | BE→FE     | `{ payload: { sceneKey: string, mediaId: string, triggerType: string, timeoutSeconds: number } }`                                                     | ✅ Existing |
| `scene_image`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, data: base64 } }`                                                                       | ✅ Existing |
| `scene_video`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, audioMode, url: string } }`                                                             | ✅ Existing |
| `video_gen_started`    | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, audioMode } }`                                                                          | ✅ Existing |
| `slotsky_trigger`      | BE→FE     | `{ payload: { anomalyType: string } }`                                                                                                                | ✅ Existing |
| `hint`                 | BE→FE     | `{ text: string }`                                                                                                                                    | ✅ Existing |
| `player_speak_prompt`  | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `overlay_text`         | BE→FE     | `{ payload: { text: string, variant: string, durationMs: number } }`                                                                                  | ✅ Existing |
| `npc_idle_nudge`       | BE→FE     | `{ payload: { phase: string, secondsSilent: number, urgency: 'soft'\|'urgent' } }`                                                                    | ✅ Existing |
| `autoplay_advance`     | BE→FE     | `{ payload: { fromStep: number, toStep: number, mediaId?: string, triggerType?: string, timeoutSeconds?: number, reason: 'timeout'\|'npc_choice' } }` | ✅ Existing |
| `audience_update`      | BE→FE     | `{ payload: { personCount, groupDynamic, observedEmotions } }`                                                                                        | ✅ Existing |
| `card_discovered`      | BE→FE     | `{ cardId: 'card1'\|'card2' }`                                                                                                                        | ✅ Existing |
| `card_collected`       | FE→BE     | `{ cardId: 'card1'\|'card2' }`                                                                                                                        | ✅ Existing |
| `dread_timer_start`    | BE→FE     | `{ durationMs: number }`                                                                                                                              | ✅ Existing |
| `game_over`            | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `good_ending`          | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `wildcard3_trigger`    | BE→FE     | `{ payload: { sceneKey: 'wildcard_good_ending' } }`                                                                                                   | ✅ Existing |
| `acecard_keyword_timer_start` | BE→FE | `{ payload: { durationMs: 30000 } }`                                                                                                           | ✅ Section A |
| `acecard_reveal_start` | BE→FE     | `{ payload: { mediaId: 'acecard_reveal_01' } }`                                                                                                       | ✅ Section A |
| `card_pickup_02_ready` | BE→FE     | `{ payload: { mediaId: 'card_pickup_02', durationMs: 15000 } }`                                                                                       | ✅ Section A |
| `acecard_reveal_complete` | FE→BE  | `{}`                                                                                                                                                  | ✅ Section A |

### `slotsky_trigger` anomalyType Values

All 13 valid `anomalyType` values for the `slotsky_trigger` event:

**GM-controlled** (declared in `gmTools.ts`, fired by Gemini function calls):

| # | anomalyType               | Description                                                            |
|---|---------------------------|------------------------------------------------------------------------|
| 1 | `anomaly_cards`           | Subtle escalation — card-related visual anomaly                        |
| 2 | `anomaly_bells`           | Subtle escalation — audio bell anomaly                                 |
| 3 | `anomaly_lights`          | Subtle escalation — lighting flicker anomaly                           |
| 4 | `anomaly_geometry`        | Removes an exit — geometric impossibility                              |
| 5 | `fourth_wall_correction`  | Full three-bells + strobe sequence at fourth_wall_count >= 3           |
| 6 | `found_transition`        | Cosmetic Slotsky pulse when characters reach FOUND state               |

**Backend-controlled** (fired by `server.ts` sequencer, never by GM):

| #  | anomalyType                     | Description                                                      |
|----|---------------------------------|------------------------------------------------------------------|
| 7  | `wildcard_vision_feed_start`    | Signals wildcard vision feed playback is beginning               |
| 8  | `wildcard_vision_feed_end`      | Signals wildcard vision feed playback has ended                  |
| 9  | `wildcard_scare_sfx`            | Triggers scare SFX during wildcard vision video                  |
| 10 | `wildcard_game_over_loading`    | Frontend CSS glitch/loading animation for game_over prep         |
| 11 | `wildcard_game_over_start`      | Signals wildcard game_over media playback is beginning           |
| 12 | `wildcard_good_ending_loading`  | Frontend CSS glitch/loading animation for good_ending prep       |
| 13 | `wildcard_good_ending_start`    | Signals wildcard good_ending media playback is beginning         |

> **SFX CONVENTION — Universal Scene Transition:** `glitch_low` (random variant) fires on every `scene_change`, `scene_image`, and `scene_video` event, and on every VHS-swap (video-to-still) transition. It is the **only** SFX used for visual scene transitions. No other SFX replaces this role.

---

## ⚠️ FRONTEND NOTE — JASON TRUST METER (PERMANENT UI)

> **Priority: HIGH — Permanent UI feature. Do NOT remove during any refactor.**

A **Trust Meter** widget must be rendered in the **lower-right corner** of the screen at all times during active gameplay. It is a minimal, always-on overlay that displays Jason's current emotional state in real time.

**Data source:** `trust_update` WS event — `{ trust_level: number, fear_index: number }`

- `trust_level` — float `0.0–1.0`. Drives the Trust bar.
- `fear_index` — float `0.0–1.0`. Drives the Fear bar.

**Visual spec:**

- Two labeled bars stacked vertically, lower-right corner, fixed position.
- Labels: `TRUST` and `FEAR` (all caps, monospace or horror-adjacent font to match game aesthetic).
- Bar fill reflects the float value (e.g. `0.75` = 75% fill).
- Color suggestion: Trust = cold blue or green; Fear = deep red or amber.
- No border, no background panel — blends into the scene, never breaks immersion.

**Animation — slow pulse (fade in / fade out only):**

- The entire widget pulses with a slow, continuous CSS `opacity` animation — fade in to full opacity, hold briefly, fade out to ~20% opacity, repeat.
- Suggested timing: ~5s per full cycle (e.g. `animation: trust-pulse 5s ease-in-out infinite`).
- The pulse is **cosmetic only** — it runs continuously while the widget is active, regardless of data changes. A data change does NOT reset or interrupt the pulse cycle.

**Activation gate — Phase 3 / Phase 4 boundary:**

- The widget is **hidden** (opacity: 0, no animation) during Phase 1 (onboarding) and Phase 2 (credits).
- The widget **activates** (becomes visible and begins pulsing) when the frontend receives the `player_speak_prompt` event (the Phase 3 → Phase 4 transition).
- Initial values before the first `trust_update` arrives: `trust_level = 0.5`, `fear_index = 0.3` (neutral defaults).

**Data updates:**

- On every `trust_update` event received over WS, animate the bar fill smoothly to the new value (CSS transition ~500ms).
- The pulse animation runs on top of/independently from the bar fill transition.

---

## GM PLAYBOOK TARGET

Documents the **target** 8-beat GM playbook. The current GM has 6 beats (in `getGameMasterSystemPrompt()`).
Updating the GM playbook is tracked as a separate backend sprint. Do not modify `gemini.ts` until that sprint is approved.

| Beat                       | Trigger                                  | GM Function Calls                                                                                                                                                                             | Duration    |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1 — DARKNESS               | Session start                            | `triggerAudienceUpdate`, `triggerTrustChange` (once)                                                                                                                                          | 0:00–~0:40  |
| 2 — FLASHLIGHT ON          | Player mentions light / visibility       | `triggerSceneChange("flashlight_beam")`, `triggerVideoGen("flashlight_beam")` (Scripted — backend serves Morphic file from disk. No live Imagen/Veo generation.)                               | ~0:40–~1:00 |
| 3 — GENERATOR / JOKER CARD | Player guides Jason to generator         | `triggerSceneChange("generator_area_start")`, `triggerVideoGen("generator_area_start")`, `triggerSceneChange("generator_area_operational")`, `triggerVideoGen("generator_area_operational")`, `card_discovered({cardId:'card1'})` (Scripted — Morphic `tunnel_generator_01` from disk.) | ~1:00–~1:30 |
| 4 — WATERPARK ENTRANCE     | Player tells Jason to start generator    | `triggerSceneChange("park_entrance")`, `triggerVideoGen("park_entrance")` (Scripted — Morphic from disk.)                                                                                     | ~1:30–~2:00 |
| 5 — WATERPARK INTERIOR     | Player / Jason explores the park         | `triggerSceneChange("park_walkway")`, `triggerVideoGen("park_walkway")` (Scripted — Morphic from disk.)                                                                                       | ~2:00–~2:30 |
| 6 — MAINTENANCE DISCOVERY  | Player guides Jason to maintenance shaft | `triggerSceneChange("maintenance_entry")`, `triggerVideoGen("maintenance_entry")`, `triggerSceneChange("maintenance_panel")`, `triggerVideoGen("maintenance_panel")`, `dread_timer_start({durationMs:30000})`, `triggerAudreyVoice` (distant cue) (Scripted — Morphic from disk.) | ~2:30–~3:00 |
| 7 — CARD 2 HUNT            | Jason searches; player instructs         | `card_discovered({cardId:'card2'})`                                                                                                                                                           | ~3:00–~3:30 |
| 8 — ENDING                 | Card 2 collected before timer expires    | `card_collected('card2')` → backend cancels dread timer → `queueWildcardGoodEndingPlayback` → wildcard_good_ending pipeline → `good_ending` emission. `found_transition` is a cosmetic Slotsky pulse, NOT the ending trigger. | ~3:30–~4:00 |

**GAME OVER VARIANT (dread timer expires before Card 2 collected):**

- Dread timer expiry → backend routes through `wildcard_game_over` pipeline → `game_over` emission.
- `wildcard_game_over` resolves `maintenance_reveal_01.mp4` from disk.
- `[SFX: monster_sound]` — loud and close, one hit, in-ear
- Then: total silence
- Screen fades to black
- Text: `GAME OVER. / THANK YOU FOR PLAYING LIMINAL SIN.`
- Session ends; browser refresh required to restart

---

## PHASE 1 — ONBOARDING

**[FRONTEND ONLY — no backend interaction]**

**Trigger:** User loads the URL.

**Screen:** Minimal. Dark background. Centered content only. No video. No audio.

**UI flow:**

```
[Title] LIMINAL SIN
[Subtitle] An AI Horror Experience

[Body]
This experience uses your camera and microphone to see and hear you.
You are a voice in the dark. That's all you are.

[Button] GRANT PERMISSIONS
```

1. User clicks `[GRANT PERMISSIONS]`
2. Browser requests camera + microphone permissions
3. **If granted:** button transitions to `[PLAY]`
4. **If denied:** display — _"This experience requires camera and microphone. Refresh to try again."_
5. User clicks `[PLAY]` → WebSocket connection opens → Phase 2

**SFX:** None. Silence.

**Backend:** WS connects on `[PLAY]`. Backend sends `session_ready` once Gemini Live sessions are established.

---

## PHASE 2 — INTRO SEQUENCE

**[CINEMATIC — no player input accepted]**

**Trigger:** Frontend receives `session_ready`.

**Screen:** Black. Credits fade in one at a time.

**Credits sequence (each line: ~2s fade-in, ~2s hold, ~1s fade-out):**

```
MYCELIA INTERACTIVE
PRESENTS
LIMINAL SIN
A voice horror experience.
Powered by Google Gemini.
```

**SFX:**

- `[SFX: wind_ambient]` — begins with first credit, low level, continuous loop
- `[SFX: floor_crack]` — fires ONCE as the final credit fades out (not randomized; this is the noclip moment)

**On sequence end:**

- Frontend sends `intro_complete` → backend
- Wind audio **continues** into Phase 3 (do not cut — it transitions to tunnel ambient)
- Screen remains BLACK

**Backend on `intro_complete`:**

- `jasonIntroFired = true`
- `gmGated = true` (GM may now fire scene/video events)
- `prewarmImageCache()` fires — pre-loads `flashlight_beam`, `generator_area`, `park_entrance` Morphic stills into memory for instant delivery
- Jason `SEQUENCE_TRIGGER` text is injected (Phase 3)
- `jasonReadyTimer` (18s) starts

---

## PHASE 3 — ACT 1 OPENING: JASON'S LANDING MONOLOGUE

**[SCRIPTED — no player input accepted — 18s gate]**

**Trigger:** `intro_complete` received by backend → `jasonManager.sendText(SEQUENCE_TRIGGER)`.

**Screen:** BLACK throughout Phase 3. No images. Audio only.

**SFX (frontend, layered under Jason's audio):**

- `[SFX: drip_loop]` — slow irregular drip, begins at Phase 3 start, continuous baseline
- `[SFX: structural_hum]` — very low building hum, begins at Phase 3 start
- `[SFX: wind_ambient]` — continuing from Phase 2, fades slightly as Jason begins

**Jason's scripted performance:**

The following is injected via `jasonManager.sendText(SEQUENCE_TRIGGER)` in `server.ts`. This is the text already in production as of B13/B14. The smartglasses discovery line (Step 6) is the **target** state — it requires a `jason.ts` lore update (tracked as a separate sprint; currently the prompt says "voicebox device").

```
STEP 1 — IMPACT:
  A single sharp involuntary grunt. Wind knocked out. No words.

STEP 2 — RECOVERY:
  Ragged exhale. Low groan as he rolls onto his back. Real pain.

STEP 3 — SILENCE:
  Hold still. Nothing but dripping water. A full beat.

STEP 4 — CALL OUT (quiet, strained):
  "Audrey?... Josh?"
  Pause. Nothing comes back. The echo dies.

STEP 5 — SILENCE:
  Longer beat. Alone in pitch blackness.

STEP 6 — TECH DISCOVERY (TARGET — requires jason.ts lore update):
  Jason notices the smartglasses HUD has activated.
  A faint status light on the lens. An audio readout pulsing.
  He says quietly: "The glasses are... the app's running. How is it—"
  He stops. He hears something. (The player's voice, if they have spoken.)
  If the player is silent: he says nothing yet. He listens.

STEP 7 — FIRST AWARENESS:
  One sentence of shock. Then cautious engagement.
  "...Who is this?"  or  "...Someone's on the line."
```

**Player audio during Phase 3:**

- All `player_speech` events are **dropped** for 18 seconds (existing `jasonReadyForPlayer` gate in `server.ts`)
- Mic and camera are runtime-blocked until interaction opens; frontend may hold permissions but must not present active interaction indicators
- Mic visualization / "speak" prompt should NOT appear yet
- No player webcam or speech is processed by gameplay logic during this phase

**On 18s timer expiry:**

- `jasonReadyForPlayer = true`
- Backend sends `player_speak_prompt` → Phase 4

---

## PHASE 4 — PLAYER INTERACTION OPENS

**[INTERACTIVE — player can speak]**

**Trigger:** Frontend receives `player_speak_prompt`.

**Screen:** Still BLACK. No image until GM fires Beat 2.

**Frontend activates:**

- Subtle "SPEAK TO JASON" hint appears
- Camera indicator becomes active for the first time (GM now receives webcam frames)
- Microphone indicator becomes active for the first time (player audio now streams to Jason)
- Live styled text overlay is allowed here (`overlay_text`) for TALK prompt variants

**Backend:**

- Player audio gate is open (`jasonReadyForPlayer = true`)
- GM receives audio + webcam frames from this point forward
- GM calls `triggerAudienceUpdate` within 10 seconds (MANDATORY — Beat 1)
- GM calls `triggerTrustChange` once based on the player's first words
- Start repeating idle-silence protocol from this point forward:
  - Every 9s of no player speech: send `npc_idle_nudge` and/or `overlay_text`
  - Every 60s of inactive phase time: commit one `autoplay_advance` to prevent deadlock

**Beat 1 ends here. Beat 2 activates (GM watches).**

---

## PHASE 5 — FLASHLIGHT SCENE

**[Beat 2 — First visual moment of the experience]**

**Trigger (GM):** Player says anything light-related — "flashlight", "light", "can you see", "look around", "is it dark", "phone", "lighter", etc. ANY light reference is the GM's cue.

**Autoplay fallback:** If no light-related command is received within 60 seconds after Phase 4 opens, Jason self-initiates flashlight use and GM executes Beat 2 automatically.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "flashlight_beam" })`
2. `triggerVideoGen({ sceneKey: "flashlight_beam" })`

(Scripted scene — backend serves Morphic file `tunnel_flashlight_01` from disk. No live Imagen/Veo generation.)

**Screen:** Transitions from BLACK to `flashlight_beam` still image. This is the demo's first visual. The still appears immediately (served from prewarm cache).

**Jason in character (free dialogue — no script):**

- He describes only what the flashlight beam directly touches. Never narrates what is beyond the beam.
- Tone: relief mixed with disorientation at the scale of the echo
- Example: _"Okay. I've got the flashlight. I can see— concrete. Just concrete. It goes a long way."_

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `flashlight_beam` (universal transition SFX — random variant)
- `[SFX: drip_loop]` — continues

**Flashlight hint (existing):**

- If no scene change fires within 45s of `intro_complete`, the backend sends `{ type: 'hint', text: 'ask him if he has a flashlight' }` to nudge the player.

---

## PHASE 5B — CARD 1 DISCOVERY (GENERATOR AREA)

**[Beat 3 — AI Vision Proof mechanic]**

**Trigger (GM):** Player guides Jason deeper / toward the generator area.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "generator_area_start" })`
2. `triggerVideoGen({ sceneKey: "generator_area_start" })`
3. `card_discovered({ cardId: 'card1' })`

(Scripted scene — backend serves Morphic file `tunnel_generator_01` from disk. No live Imagen/Veo generation.)

**Still image → Video sequence:**

- `generator_area_start` / `tunnel_generator_01`: Jason continues exploring farther down the same Boring tunnel after getting his bearings; the generator is only discovered at the far end of the beam path
- `generator_area_operational` / `tunnel_generator_01`: continuation from the end of the previous clip; same Morphic file — the generator is still a little distant and Jason walks toward it
- `generator_card_reveal` / `card_joker_01`: this is the end-state after generator activation; tunnel lights are now on, Jason's headlamp is off, and only now does the Joker card become visible near the generator base

**Frontend on `card_discovered({ cardId: 'card1' })`:**

- Floating **Joker Card** overlay appears on screen (animated, collectible)
- GM fires NO further scene/video events until `card_collected({ cardId: 'card1' })` is received
- Jason continues reacting to player speech freely; visual progression pauses

**Player clicks the card overlay:**

- Frontend sends `card_collected({ cardId: 'card1' })` to backend
- Card overlay disappears; card stored in frontend collected state

**Card timeout (22s — per-step timeout for `card_joker_01` hold):****

- If card is not clicked within timeout, Jason auto-collects it.
- During this window, backend emits 9-second silence nudges (`npc_idle_nudge` / `overlay_text`) if player does not speak.

**Backend on `card_collected({ cardId: 'card1' })`:**

- This is no longer a standalone scripted `vision_flash` still.
- Instead, card collection resolves into the **live wildcard feed pipeline**:
  1. glitch transition
  2. brief black/noise hold
  3. Jason says: _"There's a feed coming in through my glasses. I did not activate this myself."_
  4. small-frame feed playback happens with frontend CSS border
  5. scare SFX triggers with the video
  6. glitch transition out
  7. cut to the next Boring tunnel / waterpark transition scene

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `generator_area_start` (universal transition SFX — random variant)
- `[SFX: card_appear]` — subtle card materialization sound (consistent with Slotsky card SFX family)
- `[SFX: scare_wildcard]` — triggers with the wildcard feed video playback

---

## PHASE 6 — GENERATOR ON: WATERPARK ENTRANCE

**[Beat 4 — Paradise Reveal]**

**Trigger (GM):** Player speaks the correct progression phrase to move forward from the post-card still, or the per-step autoplay timer expires.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "tunnel_to_park_transition" })`
2. `triggerVideoGen({ sceneKey: "tunnel_to_park_transition" })`
3. `triggerSceneChange({ sceneKey: "park_transition_reveal" })`
4. `triggerVideoGen({ sceneKey: "park_transition_reveal" })`
5. `triggerSceneChange({ sceneKey: "park_entrance" })`
6. `triggerVideoGen({ sceneKey: "park_entrance" })`

(Scripted scenes — backend serves Morphic files `tunnel_transition_01`, `park_reveal_01`, `park_walkway_01` from disk. No live Imagen/Veo generation.)

**Screen:** The sequence now moves through three continuity beats:

- `tunnel_to_park_transition`: still in the Boring tunnel, pushing toward the impossible opening
- `park_transition_reveal`: the threshold hold between tunnel and paradise
- `park_entrance`: the full reveal of the functional underground waterpark

**Jason in character (free dialogue):**

> _"Oh my god. There's— it's a water park. It's running. The lights are on."_
> _(beat)_
> _"...It's beautiful. Why is it down here?"_

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_entrance` (universal transition SFX — random variant)
- `[SFX: generator_start]` — industrial generator spool-up, 4 seconds, fires on scene transition
- `[SFX: neon_hum]` — faint electrical neon hum, low, continuous under this phase
- `[SFX: drip_loop]` — continues but shifts register (now mixed with the neon environment)

---

## PHASE 6B — WATERPARK INTERIOR

**[Beat 5 — Scale Reveal / Liminal Transition]**

**Trigger (GM):** Player tells Jason to explore deeper into the park / Jason advances on his own after the per-step autoplay window.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "park_walkway" })`
2. `triggerVideoGen({ sceneKey: "park_walkway" })`
3. `triggerSceneChange({ sceneKey: "park_liminal" })` — chained_auto; auto-advances after 30s
4. `triggerVideoGen({ sceneKey: "park_liminal" })`

(Scripted scenes — backend serves Morphic files `park_walkway_02`, `park_liminal_01` from disk. No live Imagen/Veo generation.)

**Screen:** Jason moves through the huge waterpark on dry walkways. `park_liminal` auto-chains as a brief pass through the liminal corridor linking the main park to the maintenance zone approach.

**Jason in character (free dialogue):**

- He describes the park as he moves through it. The scale catches him off-guard.
- Autoplay fallback: if inactivity hits the per-step timeout, Jason moves through the liminal area on his own and arrives at the shaft view (Phase 6C).

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_walkway`
- `[SFX: neon_hum]` — continues
- `[SFX: waterfall_ambient]` — begins here; vast, low-register cascade sound

---

## PHASE 6C — MAINTENANCE SHAFT IN VIEW

**[Beat 5C — Decision point]**

**Trigger (GM):** `park_liminal` auto-chains from Phase 6B and brings Jason to the far edge of the park where the maintenance shaft is visible in the distance.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "park_shaft_view" })`
2. `triggerVideoGen({ sceneKey: "park_shaft_view" })`

(Scripted scene — backend serves Morphic file `shaft_maintenance_01` from disk. No live Imagen/Veo generation.)

**Screen:** `park_shaft_view` (`shaft_maintenance_01`) — the maintenance shaft access point visible from across the park, emerging from behind waterpark structures.

**Jason in character (free dialogue):**

- He notices the shaft access point in the distance. The park's ambient perfection contrasts sharply with the industrial entrance ahead.
- He may weigh whether to investigate. The player can guide him or let autoplay advance fire.
- Autoplay fallback: per-step timeout (30s) fires the `elevator_inside` advance into Phase 7.

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_shaft_view`
- `[SFX: waterfall_ambient]` — fades slightly as industrial sounds begin to intrude from the maintenance zone

---

## PHASE 7 — ELEVATOR DESCENT & MAINTENANCE CORRIDOR

**[Beat 6 — Descent and approach]**

**Trigger (GM):** Player guides Jason toward the maintenance shaft / Jason moves there on his own after Phase 6C.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "elevator_inside" })`
2. `triggerVideoGen({ sceneKey: "elevator_inside" })`
3. `triggerSceneChange({ sceneKey: "maintenance_entry" })`
4. `triggerVideoGen({ sceneKey: "maintenance_entry" })`
5. `triggerSceneChange({ sceneKey: "elevator_inside_2" })`
6. `triggerVideoGen({ sceneKey: "elevator_inside_2" })`
7. `triggerSceneChange({ sceneKey: "maintenance_panel" })`
8. `triggerVideoGen({ sceneKey: "maintenance_panel" })`
9. `triggerAudreyVoice` — distant female voice echo at the maintenance panel beat

(Scripted scenes — backend serves Morphic files `elevator_inside_01`, `elevator_entry_01`, `elevator_inside_02`, `hallway_pov_01` from disk. No live Imagen/Veo generation.)

**Scene Transition SFX:**

- `[SFX: glitch_low]` — fires on each scene transition through this phase
- `[SFX: waterfall_ambient]` — fades out completely as elevator closes
- `[SFX: metal_hum]` — low industrial drone, begins in elevator

**Jason in character (free dialogue):**

- He describes entering the maintenance elevator and the descent. The park disappears above.
- He moves through the maintenance entry into the second elevator car and then into the hallway beyond.
- Autoplay fallback: per-step timeout fires at 30s (elevator steps) and 15s (entry and panel steps) — Jason advances through each beat on his own if the player is silent.

**State at `maintenance_panel` (step 29):**

- Backend autoplay advance from step 29 → step 31 (`hallway_pov_02`) fires on per-step timeout (15s).
- No card or dread timer fires here — the acecard keyword gate begins at the next step (Phase 7B).

**Wildcard prewarm (background):**

- At `hallway_pov_02_ready` signal from frontend, backend begins background pre-generation of both `wildcard_game_over` and `wildcard_good_ending` branches.
- Backend re-attempts both at +90s as a safety pass.

---

## PHASE 7B — HALLWAY DEEP PUSH: ACECARD KEYWORD GATE

**[Beat 7 — Terminal node / two-outcome gate]**

**Trigger:** Autoplay advance from step 29 (`maintenance_panel`) fires after 15s and brings Jason to step 31 (`hallway_pov_02`). Backend immediately fires `acecard_keyword_timer_start` (30s, invisible).

**Screen:** `hallway_pov_02.png` still (clip-only — no `.mp4` for this media). Gameplay holds on this image for the duration of the keyword window.

**Backend on step 31 entry:**

- Sends `acecard_keyword_timer_start` → frontend (`{ payload: { durationMs: 30000 } }`)
- Starts invisible 30s `acecardKeywordTimer` — fires `wildcard_game_over` pipeline on expiry
- Wildcard prewarm continues in background (started at `hallway_pov_02_ready`)

**Keyword window — 30 seconds, invisible (no UI indicator):**

- Player must give Jason any instruction to grab, take, pick up, or retrieve an object
- Any semantically broad acquire/retrieve instruction counts — e.g. "grab it", "take the card", "get it", "pick it up", "there — take that", "Jason grab the card"
- GM detects the instruction → calls `triggerAcecardReveal()`

**SFX during keyword window (frontend-driven):**

- 0–10s: `[SFX: heartbeat_low]` — barely audible, slow pulse
- 10–20s: `[SFX: heartbeat_mid]` — louder, slightly faster
- 20–30s: `[SFX: heartbeat_high1]` + `[SFX: heartbeat_high2]` + `[SFX: distant_growl1]` + `[SFX: distant_growl2]` — urgent pressure, rising

**ON KEYWORD DETECTED (before 30s expiry):**

- Backend clears `acecardKeywordTimer` → sends `acecard_reveal_start { payload: { mediaId: "acecard_reveal_01" } }`
- Frontend plays `acecard_reveal_01.mp4` (clip only — no still for this media)
- Clip ends → frontend sends `acecard_reveal_complete` to backend
- Backend sends `card_pickup_02_ready { payload: { mediaId: "card_pickup_02", durationMs: 15000 } }`
- Frontend displays `card_pickup_02.png` still; floating Queen of Spades card overlay appears
- 15-second invisible countdown begins (SFX escalation continues)
- Player clicks overlay **OR** voice-commands Jason to grab it → `card_collected({ cardId: "card2" })` → routes to Phase 8 (good ending)
- 15s expires without collection → `wildcard_game_over` pipeline → game over

**ON KEYWORD TIMER EXPIRY (30s, no instruction given):**

- Backend fires `wildcard_game_over` pipeline → `game_over`
- Step 31 is a terminal advance node — no further autoplay advance from here under any path.

---

### GAME OVER BRANCH (timer expires before Card 2 collected)

**Trigger:** Backend dread timer reaches 0 — routes through `emitWildcardGameOverBranch()` in `server.ts`.

1. `slotsky_trigger({ anomalyType: "wildcard_game_over_loading" })` — frontend starts CSS glitch loop.
2. `slotsky_trigger({ anomalyType: "wildcard_game_over_start" })` — media playback begins.
3. `wildcard_game_over` scene_image + scene_video served (from `maintenance_reveal_01.mp4` on disk).
4. After 8.5s playback: backend sends `game_over`.
5. Game over screen fades in (white on black, centered):

   ```
   GAME OVER.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```

5. Frontend presents `[PLAY AGAIN]` and `[QUIT GAME]`.
6. Session is dead until restart.

---

## PHASE 8 — THE ENDING (Card 2 Found)

**[Beat 8 — "To Be Continued"]**

**Trigger:** Frontend sends `card_collected({ cardId: 'card2' })` to backend.

**Backend flow (in order):**

1. `card_collected('card2')` → backend cancels dread timer
2. `queueWildcardGoodEndingPlayback()` fires in `server.ts`
3. `slotsky_trigger({ anomalyType: "wildcard_good_ending_loading" })` — frontend starts CSS glitch loop
4. `wildcard3_trigger({ sceneKey: "wildcard_good_ending" })` — frontend glitch transition treatment
5. `wildcard_good_ending` scene_image + scene_video served (live Imagen+Veo generation)
6. After 8.5s playback: backend sends `good_ending`

`found_transition` is a cosmetic Slotsky pulse, NOT the ending trigger.

**No close-up and no detached insert.** The ending remains Jason POV throughout.

**Audrey's voice (trust-adaptive):**
Note: Jason's trust score is the only input to Audrey's dialogue. Fear index has no impact. Audrey is triggered by `server.ts` during the `wildcard_good_ending` playback (not by GM function call).
| Trust | Audrey's line |
|---|---|
| ≥ 0.7 (High) | _"Jason?"_ — soft, hopeful, as if she just heard something. She says his name. |
| 0.4–0.69 (Neutral) | One short sentence, muffled and echoing. Scared but present. |
| < 0.4 (Low) | Quiet crying. No name. A single exhale of despair. She sounds very far away. |

**SFX:**

- static feedback after the card click glitch
- Jason's running footsteps bridging into the reopened waterpark scene
- Audrey's voice over the reopened park space

**Screen transition:**

1. Waterpark scene reopens after static feedback.
2. Audrey's voice is heard.
3. Fade to black.
4. Text appears (white on black, centered):

   ```
   TO BE CONTINUED.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```

5. Frontend presents `[QUIT GAME]`.

**Jason (optional closing line — free character choice):**

- He goes quiet as the smartglasses app signal fades to static.
- He may say nothing. Or: _"...I'll find them."_
- His choice, in character.

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

> **Note:** `maintenance_reveal_01.mp4` exists on disk as a partial Morphic override. If served from disk, this prompt is not used at runtime. Retained here for reference if live generation is re-enabled.

```
First-person POV in a claustrophobic maintenance corridor, emergency red strip
lighting casting sharp angular shadows from exposed pipe clusters, at the far end
of the corridor a door that was previously closed is now open revealing absolute
blackness beyond, a single playing card — queen of spades — lies crushed and torn
on the wet concrete floor in the foreground, the sense is that something moved
through here moments ago, photorealistic industrial horror, wide angle 16mm,
high contrast red emergency lighting, 8K
```

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
| Card 1 | `card1` | Jack of Clubs   | Phase 5B (Beat 3) | AI vision proof — Jason describes player appearance |
| Card 2 | `card2` | Queen of Spades | Phase 7 (Beat 7)  | Session ending trigger — routes to good ending      |

Both cards are standard playing cards (same visual language as the `slotsky_card` three-card anomaly in Beat 5). The jack of clubs appears alone in the `generator_card_reveal` scene (`card_joker_01`), isolated in the flashlight spotlight. The queen of spades appears as the floating collectible overlay on `card_pickup_02.png` after `acecard_reveal_01.mp4` plays at the hallway end. Player has 15 seconds to click the card overlay or voice-command Jason to grab it. Card collected → good ending. Timer expiry → game over. Clip path: step 31 keyword gate branches to acecard clip, which lands on this card pick still.

---

## APPENDIX E — STEP MACHINE REGISTRY

Documents the backend step sequencer from `server.ts`. This is the actual execution engine that drives autoplay advance and per-step timeout behavior. The `STEP_MEDIA_TRIGGER` map in `server.ts` defines each step's media resolution.

The autoplay advance chain maps `fromStep → toStep` for inactivity progressing through the experience.

| Step | Scene Key                    | media_id               | Timeout | Trigger Type     | On Timeout                          |
| ---- | ---------------------------- | ---------------------- | ------- | ---------------- | ----------------------------------- |
| 7    | `flashlight_beam`            | `tunnel_flashlight_01` | 30s     | hold_for_input   | auto-advance → 9                    |
| 9    | `generator_area_start`       | `tunnel_generator_01`  | 30s     | chained_auto     | auto-advance → 11                   |
| 11   | `generator_area_operational` | `tunnel_generator_01`  | 30s     | chained_auto     | auto-advance → 13                   |
| 13   | `generator_card_reveal`      | `card_joker_01`        | 30s     | hold_for_input   | auto-collect card1 → wildcard       |
| —    | `card1_pickup_pov`           | `card_pickup_01`       | 25s     | hold_for_input   | → wildcard pipeline                 |
| —    | `wildcard_vision_feed`       | _(live gen)_           | 15s     | hold_for_input   | → step 17                           |
| 17   | `tunnel_to_park_transition`  | `tunnel_transition_01` | 30s     | chained_auto     | auto-advance → 19                   |
| 19   | `park_transition_reveal`     | `park_reveal_01`       | 30s     | chained_auto     | auto-advance → 21                   |
| 21   | `park_entrance`              | `park_walkway_01`      | 30s     | chained_auto     | auto-advance → 23                   |
| 23   | `park_walkway`               | `park_walkway_02`      | 30s     | chained_auto     | auto-advance → 24                   |
| 24   | `park_liminal`               | `park_liminal_01`      | 30s     | chained_auto     | auto-advance → 25                   |
| 25   | `park_shaft_view`            | `shaft_maintenance_01` | 30s     | hold_for_input   | auto-advance → 26                   |
| 26   | `elevator_inside`            | `elevator_inside_01`   | 30s     | hold_for_input   | auto-advance → 27                   |
| 27   | `maintenance_entry`          | `elevator_entry_01`    | 15s     | hold_for_input   | auto-advance → 28                   |
| 28   | `elevator_inside_2`          | `elevator_inside_02`   | 30s     | hold_for_input   | auto-advance → 29                   |
| 29   | `maintenance_panel`          | `hallway_pov_01`       | 15s     | hold_for_input   | auto-advance → 31                   |
| 31   | `hallway_pov_02`             | `hallway_pov_02`       | 30s     | hold_for_input   | acecard keyword gate (30s timer)    |
| —    | `acecard_reveal`             | `acecard_reveal_01`    | —       | conditional (GM) | → `card_pickup_02` still            |
| —    | `card2_pickup_pov`           | `card_pickup_02`       | 15s     | hold_for_input   | → good_ending / game_over           |
| —    | `wildcard_game_over`         | `maintenance_reveal_01`| 8s      | hold_for_input   | → `game_over`                       |
| —    | `wildcard_good_ending`       | _(live gen)_           | 8s      | hold_for_input   | → `good_ending`                     |

---

_SHOT_SCRIPT.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 2.0 | March 13, 2026_
_Canon. Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md_
