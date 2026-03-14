# SHOT_SCRIPT.md — Liminal Sin Act 1 Director's Blueprint

## Version 1.0 | March 13, 2026

### Status: PRODUCTION TARGET — Backend TBD items flagged per phase

### Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md | imagen.ts | veo.ts

---

## OVERVIEW

This is the authoritative director's blueprint for the Liminal Sin Act 1 experience. It defines the complete game flow from onboarding through both possible endings, specifying scripted dialogue, SFX cues, Imagen 4 scene keys, Veo 3.1 Fast animation prompts, and WebSocket event sequences.

**Architecture reference:**
| File | Purpose |
|---|---|
| `server/server.ts` | WS lifecycle, gate timers, intro_complete handler |
| `server/services/gameMaster.ts` | GM function call router |
| `server/services/imagen.ts` | Imagen 4 prompts — `ZONE_PROMPTS` dict |
| `server/services/veo.ts` | Veo 3.1 animation hints — `ANIMATION_HINTS` dict |
| `server/services/npc/jason.ts` | Jason NPC system prompt |
| `server/services/gemini.ts` | GM 6-beat playbook — `getGameMasterSystemPrompt()` |
| `myceliainteractive` (frontend) | UI, onboarding, card overlay, dread timer SFX |

**Hardcoded invariants (never violate):**

- All imagery is **Jason's first-person POV** — what Jason sees; never a third-person camera.
- The experience **never pauses**. No menus. No titles mid-session. No game-over UI that breaks tone.
- **No HUD, no backpack, no smart glasses UI overlay** — deferred to Act 2.
- The room starts in **total darkness**. No images generate until Beat 2 (flashlight moment).
- Voicebox lore → **smartglasses app** (affects `jason.ts` and `server.ts`; tracked as separate sprint).

---

## SCENE KEY REGISTRY

All Imagen 4 / Veo scene keys used in this script. Must exist in both `ZONE_PROMPTS` (`imagen.ts`) and `ANIMATION_HINTS` (`veo.ts`).

| Key                          | Phase    | Status           | Notes                                                  |
| ---------------------------- | -------- | ---------------- | ------------------------------------------------------ |
| `flashlight_beam`            | Phase 5  | ✅ Canonical     | `i1` / `v1`                                            |
| `generator_area_start`       | Phase 5B | ✅ Canonical     | `i2` / `v2`                                            |
| `generator_area_operational` | Phase 5B | ✅ Canonical     | `i3` / `v3`                                            |
| `generator_card_reveal`      | Phase 5B | ✅ Canonical     | State reached from `v3` -> `i4`                        |
| `card1_pickup_pov`           | Phase 5B | ✅ Canonical     | `i4` / `v4`; no close-up                               |
| `vision_flash`               | Phase 5C | Deprecated alias | Do not use in new sequencing                           |
| `tunnel_to_park_transition`  | Phase 6  | ✅ Canonical     | `i6` / `v6`                                            |
| `park_transition_reveal`     | Phase 6  | ✅ Canonical     | `i7` / `v7`                                            |
| `park_entrance`              | Phase 6A | ✅ Canonical     | `i8` / `v8`                                            |
| `park_walkway`               | Phase 6B | ✅ Canonical     | `i9` / `v9`                                            |
| `park_shaft_view`            | Phase 6C | ✅ Canonical     | `i10` / `v10`                                          |
| `maintenance_entry`          | Phase 7  | ✅ Canonical     | `i11` / `v11`                                          |
| `maintenance_panel`          | Phase 7  | ✅ Canonical     | `i12` / `v12`                                          |
| `card2_pickup_pov`           | Phase 8  | ✅ Canonical     | `i13` / `v13`; no close-up                             |
| `wildcard_vision_feed`       | Phase 5C | ✅ Canonical     | Live anomaly image/video pair built from player camera |
| `wildcard_game_over`         | Phase 7B | ✅ Canonical     | Live anomaly image/video pair for bad ending           |
| `wildcard_good_ending`       | Phase 8  | ✅ Canonical     | Live image-to-video wildcard branch for good ending    |

---

## ACT 1 MEDIA REGISTRY — AUTHORITATIVE

This section supersedes any earlier reduced 5-scene interpretation. The canonical Act 1 media plan is:

- 13 scripted images
- 13 scripted videos
- 2 wildcard images
- 2 wildcard videos

### Hard Invariants

- All scenes, images, and videos are **16:9, high-quality, photorealistic, cinematic**.
- Everything is **Jason's first-person POV**.
- **No close-up shots** are allowed anywhere in Act 1.
- Darkness phase has **zero visual generations**. Screen remains black until flashlight activation.
- Jason must not be given environmental visual knowledge before flashlight activation.
- `i1` is the only fully fresh scripted image generation in the chained sequence.
- Every scripted still image after `i1` is conceptually the **last frame extracted from the previous scripted video**.
- The missing `v5` is intentional. That slot is replaced by the **live wildcard smartglasses anomaly video**.
- Every still-frame gameplay node after TALK opens has a **60-second autoplay timer**. If the player does not say the correct trigger phrase, or trust gating blocks the branch, the paired `vX` triggers automatically.
- Every idle still-frame node also supports **15-second NPC automation** so Jason can talk to himself, call for Audrey/Josh, or address the player if the player remains silent.
- The Boring tunnel remains the active environment through the full generator sequence. The waterpark does not appear until after the wildcard interruption and the tunnel-to-park transition.

### Canonical Sequencing

| Order | Slot                    | Key                          | Meaning                                                               |
| ----- | ----------------------- | ---------------------------- | --------------------------------------------------------------------- |
| 1     | `i1` / `v1`             | `flashlight_beam`            | Flashlight turns on; Jason gets bearings in darkness                  |
| 2     | `i2` / `v2`             | `generator_area_start`       | Generator area first discovered                                       |
| 3     | `i3` / `v3`             | `generator_area_operational` | Generator area stabilized; lead-in to turn-on moment                  |
| 4     | `i4`                    | `generator_card_reveal`      | End-state extracted from `v3`; Joker card now present                 |
| 5     | `v4`                    | `card1_pickup_pov`           | Joker card pickup video; no close-up                                  |
| 6     | `wildcard1 image/video` | `wildcard_vision_feed`       | Live smartglasses anomaly built from player camera extraction         |
| 7     | `i6` / `v6`             | `tunnel_to_park_transition`  | Jason explores forward from the Boring tunnel after wildcard resolves |
| 9     | `i7` / `v7`             | `park_transition_reveal`     | Reveal hold between tunnel and paradise park                          |
| 10    | `i8` / `v8`             | `park_entrance`              | Perfect waterpark crashed into boring tunnel                          |
| 11    | `i9` / `v9`             | `park_walkway`               | Jason exploring massive walkways between water features               |
| 12    | `i10` / `v10`           | `park_shaft_view`            | Maintenance shaft visible in distance from park                       |
| 13    | `i11` / `v11`           | `maintenance_entry`          | Jason commits to maintenance path                                     |
| 14    | `i12` / `v12`           | `maintenance_panel`          | Something must be uncovered or moved to find last card                |
| 15    | `wildcard2 image/video` | `wildcard_game_over`         | Live anomaly bad-ending branch                                        |
| 16    | `i13` / `v13`           | `card2_pickup_pov`           | Final card pickup / collection; no close-up                           |

### Media Filename Registry (Morphic Import)

Use basename as trigger id. Frontend resolves `.png` for hold frames and `.mp4` for clip playback.

| media_id                | still filename             | clip filename               | trigger type   | audio mode   | timeout seconds |
| ----------------------- | -------------------------- | --------------------------- | -------------- | ------------ | --------------- |
| `tunnel_darkness_01`    | `tunnel_darkness_01.png`   | `tunnel_darkness_01.mp4`    | hold_for_input | muted        | 22              |
| `tunnel_flashlight_01`  | `tunnel_flashlight_01.png` | `tunnel_flashlight_01.mp4`  | hold_for_input | native_audio | 30              |
| `tunnel_generator_01`   | `tunnel_generator_01.png`  | `tunnel_generator_01.mp4`   | chained_auto   | native_audio | 30              |
| `card_joker_01`         | `card_joker_01.png`        | `card_joker_01.mp4`         | hold_for_input | native_audio | 22              |
| `card_pickup_01`        | `card_pickup_01.png`       | `card_pickup_01.mp4`        | hold_for_input | native_audio | 25              |
| `card_pickup_02`        | `card_pickup_02.png`       | `card_pickup_02.mp4`        | hold_for_input | native_audio | 25              |
| `acecard_reveal_01`     | n/a                        | `acecard_reveal_01.mp4`     | hold_for_input | native_audio | 22              |
| `tunnel_transition_01`  | `tunnel_transition_01.png` | `tunnel_transition_01.mp4`  | chained_auto   | native_audio | 30              |
| `park_reveal_01`        | `park_reveal_01.png`       | `park_reveal_01.mp4`        | chained_auto   | native_audio | 30              |
| `park_walkway_01`       | `park_walkway_01.png`      | `park_walkway_01.mp4`       | chained_auto   | native_audio | 30              |
| `park_walkway_02`       | `park_walkway_02.png`      | `park_walkway_02.mp4`       | chained_auto   | native_audio | 30              |
| `park_liminal_01`       | `park_liminal_01.png`      | `park_liminal_01.mp4`       | hold_for_input | native_audio | 22              |
| `shaft_maintenance_01`  | n/a                        | `shaft_maintenance_01.mp4`  | hold_for_input | native_audio | 22              |
| `maintenance_reveal_01` | n/a                        | `maintenance_reveal_01.mp4` | hold_for_input | native_audio | 15              |
| `elevator_entry_01`     | `elevator_entry_01.png`    | `elevator_entry_01.mp4`     | hold_for_input | native_audio | 15              |
| `elevator_inside_01`    | `elevator_inside_01.png`   | `elevator_inside_01.mp4`    | hold_for_input | native_audio | 15              |
| `elevator_inside_02`    | `elevator_inside_02.png`   | `elevator_inside_02.mp4`    | hold_for_input | native_audio | 15              |
| `hallway_pov_01`        | `hallway_pov_01.png`       | `hallway_pov_01.mp4`        | hold_for_input | native_audio | 15              |

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
- Wildcard timing rule: because this process tree can take roughly **90 seconds**, backend must begin preparing `wildcard_vision_feed` at least 90 seconds before the intended card-discovery/payoff moment, hold the finished asset server-side, and trigger playback immediately when the card collection beat resolves.
- Wildcard playback flow is canonical:
  1. glitch transition
  2. dark screen / light screen noise hold
  3. Jason says: "There's a feed coming in through my glasses. I did not activate this myself."
  4. video plays in a small frame with frontend CSS HUD border
  5. scare SFX triggers with video
  6. glitch transition
  7. cut to next scene
- `wildcard_game_over` is the live anomaly ending branch. It can use the player's real-world room framing as the basis for the generated intrusion event.
- `wildcard_good_ending` is a live image-to-video wildcard branch used only after card2 pickup resolves.
- Wildcard prewarm guardrail (mandatory):
  1. At `hallway_pov_02` still activation, backend begins background preparation for BOTH `wildcard_game_over` and `wildcard_good_ending`.
  2. Backend re-attempts prewarm at +90s if either wildcard branch is still not ready.
  3. Card2 click path must consume prewarmed `wildcard_good_ending` before emitting `good_ending`.
  4. Dread timer expiry path must consume prewarmed `wildcard_game_over` before emitting `game_over`.
  5. While wildcard2/3 media is still loading, backend emits `slotsky_trigger` loading markers and frontend must run CSS glitch/loading effects until `scene_video` arrives.
  6. For wildcard2/3 video prompts, enforce: no music, natural ambient sounds only.

### Waterpark Rule

The waterpark is a **functional paradise**. It is liminal, perfect, immense, and operational. It is not abandoned, rotted, ruined, wasted, flooded-out, or dead. Prompt language must preserve that distinction.

---

## WS EVENT REGISTRY

Extends the contract defined in `CURRENT_STATE.md`. Items marked ⚠️ Backend TBD are new events not yet wired in `server.ts` / `gameMaster.ts`.

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
| `scene_change`         | BE→FE     | `{ payload: { sceneKey: string } }`                                                                                                                   | ✅ Existing |
| `scene_image`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, data: base64 } }`                                                                       | ✅ Existing |
| `scene_video`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, audioMode, url: string } }`                                                             | ✅ Existing |
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

| Beat                       | Trigger                                  | GM Function Calls                                                                                                                                            | Duration    |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1 — DARKNESS               | Session start                            | `triggerAudienceUpdate`, `triggerTrustChange` (once)                                                                                                         | 0:00–~0:40  |
| 2 — FLASHLIGHT ON          | Player mentions light / visibility       | `triggerSceneChange("flashlight_beam")`, `triggerVideoGen("flashlight_beam")`                                                                                | ~0:40–~1:00 |
| 3 — GENERATOR / JOKER CARD | Player guides Jason to generator         | `triggerSceneChange("generator_area")`, `triggerVideoGen("generator_area")`, `card_discovered({cardId:'card1'})`                                             | ~1:00–~1:30 |
| 4 — WATERPARK ENTRANCE     | Player tells Jason to start generator    | `triggerSceneChange("park_entrance")`, `triggerVideoGen("park_entrance")`                                                                                    | ~1:30–~2:00 |
| 5 — WATERPARK INTERIOR     | Player / Jason explores the park         | `triggerSceneChange("park_walkway")`, `triggerVideoGen("park_walkway")`                                                                                      | ~2:00–~2:30 |
| 6 — MAINTENANCE DISCOVERY  | Player guides Jason to maintenance shaft | `triggerSceneChange("maintenance_area")`, `triggerVideoGen("maintenance_area")`, `dread_timer_start({durationMs:60000})`, `triggerAudreyVoice` (distant cue) | ~2:30–~3:00 |
| 7 — CARD 2 HUNT            | Jason searches; player instructs         | `card_discovered({cardId:'card2'})`                                                                                                                          | ~3:00–~3:30 |
| 8 — ENDING                 | Card 2 collected before timer expires    | `triggerSlotsky("found_transition")`                                                                                                                         | ~3:30–~4:00 |

**GAME OVER VARIANT (timer expires in Beat 5 before Card 2 collected):**

- Backend sends `game_over` (⚠️ Backend TBD)
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
- `prewarmImageCache()` fires — generates `flashlight_beam`, `generator_area`, `park_entrance` in parallel
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
  - Every 15s of no player speech: send `npc_idle_nudge` and/or `overlay_text`
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

**Screen:** Transitions from BLACK to `flashlight_beam` still image. This is the demo's first visual. The still appears immediately (served from prewarm cache). Veo generates **up to two sequential videos** for this beat:

- Video 1: Jason getting his bearings — beam sweeps the space, catching water droplets in mid-air
- Video 2 (if GM fires a second `triggerVideoGen("flashlight_beam")`): Jason actively searching for the generator — beam probing the industrial distance

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

1. `triggerSceneChange({ sceneKey: "generator_area" })`
2. `triggerVideoGen({ sceneKey: "generator_area" })`
3. `card_discovered({ cardId: 'card1' })`

**Still image → Video sequence:**

- `generator_area_start` / `v2`: Jason continues exploring farther down the same Boring tunnel after getting his bearings; the generator is only discovered at the far end of the beam path
- `generator_area_operational` / `v3`: continuation from the end of video 2; the generator is still a little distant and Jason walks toward it
- `generator_card_reveal` / `i4`: this is the end-state after generator activation; tunnel lights are now on, Jason's headlamp is off, and only now does the Joker card become visible near the generator base

**Frontend on `card_discovered({ cardId: 'card1' })`:**

- Floating **Joker Card** overlay appears on screen (animated, collectible)
- GM fires NO further scene/video events until `card_collected({ cardId: 'card1' })` is received
- Jason continues reacting to player speech freely; visual progression pauses

**Player clicks the card overlay:**

- Frontend sends `card_collected({ cardId: 'card1' })` to backend
- Card overlay disappears; card stored in frontend collected state

**Card timeout (60s):**

- If card is not clicked within 60 seconds, Jason auto-collects it.
- During this window, backend emits 15-second silence nudges (`npc_idle_nudge` / `overlay_text`) if player does not speak.

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

- `[SFX: glitch_low]` — fires on scene transition to `generator_area` (universal transition SFX — random variant)
- `[SFX: card_appear]` — subtle card materialization sound (consistent with Slotsky card SFX family)
- `[SFX: scare_wildcard]` — triggers with the wildcard feed video playback

---

## PHASE 6 — GENERATOR ON: WATERPARK ENTRANCE

**[Beat 4 — Paradise Reveal]**

**Trigger (GM):** Player speaks the correct progression phrase to move forward from the post-card still, or the one-minute autoplay timer expires.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "tunnel_to_park_transition" })`
2. `triggerVideoGen({ sceneKey: "tunnel_to_park_transition" })`
3. `triggerSceneChange({ sceneKey: "park_transition_reveal" })`
4. `triggerVideoGen({ sceneKey: "park_transition_reveal" })`
5. `triggerSceneChange({ sceneKey: "park_entrance" })`
6. `triggerVideoGen({ sceneKey: "park_entrance" })`

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

**[Beat 5 — Scale Reveal]**

**Trigger (GM):** Player tells Jason to explore deeper into the park / Jason advances on his own after the one-minute autoplay window.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "park_walkway" })`
2. `triggerVideoGen({ sceneKey: "park_walkway" })`
3. `triggerSceneChange({ sceneKey: "park_shaft_view" })`
4. `triggerVideoGen({ sceneKey: "park_shaft_view" })`

**Screen:** Jason moves through the huge waterpark on dry walkways and the distant maintenance shaft becomes the end-state of the next reveal beat.

**Jason in character (free dialogue):**

- He describes the park as he moves through it. The scale catches him off-guard.
- He notices the maintenance shaft in the distance. He may ask the player whether to investigate.
- Autoplay fallback: if inactivity hits 60s, Jason moves toward the maintenance corridor on his own.

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_walkway`
- `[SFX: neon_hum]` — continues
- `[SFX: waterfall_ambient]` — begins here; vast, low-register cascade sound

---

## PHASE 7 — MAINTENANCE AREA: DREAD TIMER

**[Beat 6 → Beat 7 — Invisible pressure / two-ending branch]**

**Trigger (GM):** Player guides Jason toward the maintenance shaft / Jason moves there on his own.

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "maintenance_entry" })`
2. `triggerVideoGen({ sceneKey: "maintenance_entry" })`
3. `triggerSceneChange({ sceneKey: "maintenance_panel" })`
4. `triggerVideoGen({ sceneKey: "maintenance_panel" })` — panel-removal video fires only when instructed or autoplay resolves it
5. `dread_timer_start({ durationMs: 60000 })` — 60-second countdown for puzzle state
6. `triggerAudreyVoice` — distant female voice at maintenance discovery
7. `card_discovered({ cardId: 'card2' })` — fires once panel removal reveals the card

**Scene Transition SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `maintenance_area`

**Dread Timer behavior (frontend):**

- The card is **hidden** — under or behind something in the maintenance corridor. Jason must be instructed by the player (or act on his own) to move/uncover it. There is no card visible in the scene image.
- Timer runs invisibly — **zero UI indicator**
- SFX escalates autonomously over 60 seconds:
  - 0–20s: `[SFX: heartbeat_low]` — barely audible, slow pulse
  - 20–40s: `[SFX: heartbeat_mid]` — louder, slightly faster
  - 40–60s: `[SFX: heartbeat_high1]` + `[SFX: heartbeat_high2]` + `[SFX: distant_growl1]` + `[SFX: distant_growl2]` — urgent pressure, rising
- Timer is **cancelled** when `card_collected({ cardId: 'card2' })` is sent to backend

**Card 2 overlay:**

- Floating overlay appears on screen when Jason uncovers the final card
- A **30-second click timer** begins here
- If the player clicks in time -> `card_collected({ cardId: 'card2' })`
- If 30 seconds passes without click -> game over path

**Card 2 timeout (60s):**

- If card is not collected before the dread timer expires, Jason makes an autonomous choice.
- Timer outcome is deterministic: timer expiry → game over; card before expiry → good ending.

---

### GAME OVER BRANCH (timer expires before Card 2 collected)

**Trigger:** Backend dread timer reaches 0 — sends `game_over` — **[⚠️ Backend TBD]**

1. CSS glitch transition begins.
2. Screen goes black again.
3. `wildcard_game_over` live anomaly pipeline resolves and plays.
4. Game over screen fades in (white on black, centered):

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

**GM calls (in order):**

1. `triggerSlotsky({ anomalyType: "found_transition" })` — glitch transition on collection
2. Jason is heard running.
3. Scene opens up again back in the waterpark.
4. `triggerAudreyVoice({ trustLevel: <current_trust_level> })`

**No close-up and no detached insert.** The ending remains Jason POV throughout.

**Audrey's voice (trust-adaptive):**
Note: Jason's trust score is the only input to Audrey's dialogue. Fear index has no impact.
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

## APPENDIX A — IMAGEN 4 PROMPTS (CANONICAL)

All prompts are first-person POV. No human figures unless explicitly noted. No smart glasses, no HUD overlays. Use verbatim as `ZONE_PROMPTS` values in `server/services/imagen.ts`.

---

### `flashlight_beam`

```
First-person POV in total darkness underground, a single flashlight beam shooting
forward through absolute blackness, Jason's right hand visible at the bottom of
frame gripping a heavy rubberized flashlight, beam illuminating wet concrete floor
ahead and catching water droplets suspended in mid-air, walls beyond the beam edge
barely visible in peripheral darkness as faint grey, cold white light source, pure
black surround, no ambient lighting anywhere, photorealistic horror photography,
wide angle 16mm, high contrast, cinematic horror, 8K
```

---

### `generator_area`

```
First-person POV looking toward an industrial diesel generator unit set against
rough dark concrete wall underground, warm amber flashlight glow from below
illuminating the battered metal generator housing and surrounding concrete floor,
a single playing card — jack of clubs, face-up, pristine — lying flat on wet
concrete at the base of the generator, isolated in a tight flashlight spotlight
as if placed deliberately, no other people, photorealistic, wide angle 24mm,
brutalist industrial concrete, oil-stained floor, cinematic horror, 8K
```

---

### `zone_park_shore` (UPDATED — reworked to paradise-trap aesthetic)

```
First-person POV standing at the threshold of a vast underground water park that
looks like a drowned paradise — lush artificial tropical foliage bleached bone-white
with moisture and age but still dense and overhanging the walkway, fragments of
broken neon signs glowing pink and teal reflected in the perfectly still dark water
below, illuminated aquamarine shimmer rising from beneath the pool surface,
warm amber flood construction lights on tripod stands competing with cold neon,
abandoned fiberglass water slides in faded primary colors half-submerged in still
water, glassy mirror reflection making the space appear infinite downward, beautiful
and deeply wrong simultaneously, total implied silence, no people, photorealistic
architectural photography, wide angle 16mm, lush tropical meets brutalist concrete,
cinematic horror, 8K
```

---

### `maintenance_area`

```
First-person POV standing in an industrial maintenance corridor branching off an
underground water park, exposed pipe clusters and electrical conduit running along
low brutalist concrete ceiling, faded yellow safety signage barely legible on damp
walls, flashlight cone cutting forward into the industrial dark, through an open
arched doorway in the background the park's aquamarine neon glow bleeds into frame —
a sliver of paradise behind the industrial grimness, decorative arch frame with
moisture-stained painted tropical mural barely visible through the staining, no
people, photorealistic, wide angle 16mm, industrial concrete with neon bleed,
cinematic horror, 8K
```

---

### `card2_closeup`

```
Close-up first-person POV, a queen of spades playing card lying face-up held in an
open palm, flashlight beam from directly above casting hard-edged shadows from card
corners onto the palm below, card surface pristine and bone-dry despite the
surrounding damp, wet concrete floor faintly visible blurred in the background,
photorealistic, 50mm macro-style lens, shallow depth of field, high contrast
flashlight illumination, cinematic horror, 8K
```

---

## APPENDIX B — VEO 3.1 FAST ANIMATION HINTS (CANONICAL)

All animations are first-person POV, no sudden cuts. Use verbatim as `ANIMATION_HINTS` values in `server/services/veo.ts`.

---

### `flashlight_beam`

```
Flashlight beam sweeps slowly left then right through total darkness, catching
suspended water droplets as it moves — each droplet briefly lit then returns to
black — no environment fills in during the sweep, only what the beam directly
touches is visible, beam completes one full sweep and returns to center pointing
forward, holds steady
```

---

### `generator_area`

```
Slow downward tilt from the generator body, flashlight tracking down toward the
playing card at the generator's base, slight mechanical vibration in the frame from
the running generator, beam contracts tighter around the card as if drawn to it,
card remains perfectly still, camera holds on the card
```

---

### `zone_park_shore` (UPDATED — reworked to paradise-trap motion)

```
Slow awe-scan pan sweeping left across the glowing underground water park, neon
colors reflected and rippling gently in the perfectly still pool surface below,
bleached ghostly foliage at the edge of the frame barely sways in an unfelt draft,
the beauty is genuine and the wrongness is genuine simultaneously, no sudden
movement, the space holds its breath, pan decelerates to stillness
```

---

### `maintenance_area`

```
Rapid urgent searching scan, flashlight sweeps left to right across pipes and
conduit, beam pauses briefly on each deep shadow as if checking for movement,
swings back sharply to the aquamarine-glowing park doorway in the background —
the neon glow through the arch flickers once — then flashlight swings forward
again, tense searching energy throughout, no slow drift
```

---

### `card2_closeup`

```
Jason's hand begins with the card face-down and slowly rotates to reveal the queen
of spades face-up, motion is deliberate and slow as if reverent, flashlight shadow
tracks with the rotation casting a moving edge shadow across the palm, card arrives
at face-up position and camera holds perfectly still on the revealed queen of spades
```

---

## APPENDIX C — PREWARM CACHE TARGET

`PREWARM_SCENE_KEYS` in `server/services/imagen.ts` should contain:

```typescript
const PREWARM_SCENE_KEYS = [
  "flashlight_beam",
  "generator_area",
  "zone_park_shore",
] as const;
```

**Rationale:** `flashlight_beam` is the first visual moment (Beat 2), and `generator_area` follows immediately in the primary flow, so both are prewarmed. `zone_park_shore` remains the first large reveal anchor. `maintenance_area` and `card2_closeup` are later-game beats where on-demand generation has enough time to complete.

---

## APPENDIX D — CARD COLLECTIBLES SPEC

| Card   | ID      | Visual          | Phase             | Contains                                            |
| ------ | ------- | --------------- | ----------------- | --------------------------------------------------- |
| Card 1 | `card1` | Jack of Clubs   | Phase 5B (Beat 3) | AI vision proof — Jason describes player appearance |
| Card 2 | `card2` | Queen of Spades | Phase 7 (Beat 5)  | Session ending trigger — routes to good ending      |

Both cards are standard playing cards (same visual language as the `slotsky_card` three-card anomaly in Beat 5). The jack of clubs appears alone in the `generator_area` scene image, isolated in the flashlight spotlight. The queen of spades appears as the floating collectible overlay in Phase 7 and becomes the `card2_closeup` final image.

---

_SHOT_SCRIPT.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 1.0 | March 11, 2026_
_Canon. Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md_
