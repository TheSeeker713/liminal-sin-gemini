# SHOT_SCRIPT.md — Liminal Sin Act 1 Director's Blueprint

## Version 3.0 | March 15, 2026

### Status: PRODUCTION — Revised against LS_VIDEO_PIPELINE.md

### Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md | SHOT_STEPS.md | LS_VIDEO_PIPELINE.md | imagen.ts | veo.ts

---

## OVERVIEW

This is the authoritative director's blueprint for the Liminal Sin Act 1 experience. It defines the complete game flow from onboarding through both possible endings, specifying scripted dialogue, SFX cues, scene keys, and WebSocket event sequences.

Scripted scenes are served from pre-built Morphic files hosted on GCS (`gs://liminal-sin-assets`). Imagen 4 and Veo 3.1 are invoked **ONLY** for the 3 wildcard live-generation events (`wildcard_vision_feed`, `wildcard_game_over`, `wildcard_good_ending`).

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
| `assets/generated_stills/` | 15 canonical pre-built Morphic `.png` files (source; hosted on GCS `liminal-sin-assets/stills/`) — darkness phase is CSS black screen, no still |
| `assets/generated_clips/` | 18 canonical pre-built Morphic `.mp4` files (source; hosted on GCS `liminal-sin-assets/clips/`) — includes `flashlight_sweep_01` |
| `docs/SHOT_STEPS.md` | Scene key registry, canonical sequencing, media filename registry, step machine |
| `myceliainteractive` (frontend) | UI, onboarding, card overlay, dread timer SFX |

**Hardcoded invariants (never violate):**

- All imagery is **Jason's first-person POV** — what Jason sees; never a third-person camera.
- The experience **never pauses**. No menus. No titles mid-session. No game-over UI that breaks tone.
- **No HUD, no backpack, no smart glasses UI overlay** — deferred to Act 2.
- The room starts in **total darkness** — CSS black screen only, no media file. No images generate until the player triggers the flashlight keyword.
- Voicebox lore → **smartglasses app** (affects `jason.ts` and `server.ts`; tracked as separate sprint).
- **Scripted media is never re-generated at runtime.** All scripted stills and clips are pre-built Morphic files served from GCS (`https://storage.googleapis.com/liminal-sin-assets/`).

---

## SCENE KEY REGISTRY

→ **[SHOT_STEPS.md — Scene Key Registry](SHOT_STEPS.md)**

---

## ACT 1 MEDIA REGISTRY — AUTHORITATIVE

→ **[SHOT_STEPS.md — Act 1 Media Registry](SHOT_STEPS.md)**

---

## WS EVENT REGISTRY

→ **[WS_EVENTS.md — WebSocket Events, Slotsky anomalyTypes, SFX Convention](WS_EVENTS.md)**

---

## FRONTEND SPEC

→ **[FRONTEND_SPEC.md — Jason Trust Meter UI](FRONTEND_SPEC.md)**

---

## GM PLAYBOOK TARGET

Documents the **target** 8-beat GM playbook. The current GM has 6 beats (in `getGameMasterSystemPrompt()`).
Updating the GM playbook is tracked as a separate backend sprint. Do not modify `gemini.ts` until that sprint is approved.

| Beat                       | Trigger                                  | GM Function Calls                                                                                                                                                                             | Duration    |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1 — DARKNESS               | Session start                            | `triggerAudienceUpdate`, `triggerTrustChange` (once)                                                                                                                                          | 0:00–~0:40  |
| 2 — FLASHLIGHT ON          | Player mentions light / visibility       | `triggerSceneChange("flashlight_beam")`, `triggerVideoGen("flashlight_beam")` (Scripted — backend serves Morphic file `flashlight_sweep_01` from GCS. No live Imagen/Veo generation.)                               | ~0:40–~1:00 |
| 3 — GENERATOR / JOKER CARD | Player guides Jason to generator         | `triggerSceneChange("generator_area_start")`, `triggerVideoGen("generator_area_start")`, `triggerSceneChange("generator_area_operational")`, `triggerVideoGen("generator_area_operational")`, `card_discovered({cardId:'card1'})` (Scripted — Morphic `tunnel_generator_01` from disk.) | ~1:00–~1:30 |
| 4 — WATERPARK ENTRANCE     | Player tells Jason to start generator    | `triggerSceneChange("park_entrance")`, `triggerVideoGen("park_entrance")` (Scripted — Morphic from disk.)                                                                                     | ~1:30–~2:00 |
| 5 — WATERPARK INTERIOR     | Player / Jason explores the park         | `triggerSceneChange("park_walkway")`, `triggerVideoGen("park_walkway")` (Scripted — Morphic from disk.)                                                                                       | ~2:00–~2:30 |
| 6 — MAINTENANCE DISCOVERY  | Player guides Jason to maintenance shaft | `triggerSceneChange("maintenance_entry")`, `triggerVideoGen("maintenance_entry")`, `triggerSceneChange("maintenance_panel")`, `triggerVideoGen("maintenance_panel")`, `dread_timer_start({durationMs:30000})`, `triggerAudreyVoice` (distant cue) (Scripted — Morphic from disk.) | ~2:30–~3:00 |
| 7 — CARD 2 HUNT            | Jason searches; player instructs         | `card_discovered({cardId:'card2'})`                                                                                                                                                           | ~3:00–~3:30 |
| 8 — ENDING                 | Card 2 collected before timer expires    | `card_collected('card2')` → backend cancels dread timer → `queueWildcardGoodEndingPlayback` → wildcard_good_ending pipeline → `good_ending` emission. `found_transition` is a cosmetic Slotsky pulse, NOT the ending trigger. | ~3:30–~4:00 |

**GAME OVER VARIANT (dread timer expires before Card 2 collected):**

- Dread timer expiry → backend routes through `wildcard_game_over` pipeline → `game_over` emission.
- **WILDCARD 2 is frontend CSS/SFX only** — no backend video generation for the game_over branch.
- `[SFX: monster_sound]` — loud and close, one hit, in-ear
- Then: total silence
- Screen fades to black
- Text: `GAME OVER. / THANK YOU FOR PLAYING LIMINAL SIN.`
- Frontend presents `[PLAY AGAIN]` and `[QUIT GAME]`

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

(Scripted scene — backend serves Morphic file `flashlight_sweep_01` from GCS. No live Imagen/Veo generation.)

**Clip chain — 3 clips auto-chained (per LS_VIDEO_PIPELINE):**

1. **`flashlight_sweep_01`** (10s, **muted** — the only muted clip in Act 1). First visual moment. Jason says: _"the wall says Boring, but this is far from boring."_ Walking SFX + ambient sounds play. Player can interrupt Jason.
2. **`tunnel_flashlight_01`** (15s, has no baked sound — SFX driven by frontend). Plays immediately after flashlight sweep. At 3s walking SFX starts. At 7s Jason reacts to a white generator moving on its own toward him. At 12s stop walking SFX.
3. **`tunnel_generator_01`** (10s, has no baked sound). Plays immediately after tunnel flashlight. At 1.5s walking SFX starts. At 6s Jason notices the name on the wall changed to "Bard". Stop walking SFX at end of clip.

**Screen:** Transitions from BLACK to `flashlight_sweep_01` clip. This is the demo's first visual.

**Jason in character (free dialogue — no script):**

- He describes only what the flashlight beam directly touches. Never narrates what is beyond the beam.
- Tone: relief mixed with disorientation at the scale of the echo

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `flashlight_beam` (universal transition SFX — random variant)
- `[SFX: drip_loop]` — continues
- Walking SFX and ambient sounds during `flashlight_sweep_01`

**Flashlight hint (existing):**

- If no scene change fires within 45s of `intro_complete`, the backend sends `{ type: 'hint', text: 'ask him if he has a flashlight' }` to nudge the player.

---

## PHASE 5B — CARD 1 DISCOVERY (GENERATOR AREA)

**[Beat 3 — AI Vision Proof mechanic]**

**Trigger (GM):** Player guides Jason toward the generator / says "turn on the generator".

**GM calls (in order):**

1. `triggerSceneChange({ sceneKey: "generator_card_reveal" })`
2. `triggerVideoGen({ sceneKey: "generator_card_reveal" })`
3. `card_discovered({ cardId: 'card1' })`

(Scripted scene — backend serves Morphic file `card_joker_01` from GCS. No live Imagen/Veo generation.)

**Tunnel Generator Idle (`tunnel_generator_01.png`):** Still image extracted from the `tunnel_generator_01` clip. This still is both time TRIGGERED and KEYWORD TRIGGERED. The player must use keywords like "turn on the generator" to trigger the next clip. If they fail to do so, the still auto-advances after timeout.

**Joker Card Reveal — `card_joker_01` (15s, no baked sound):**

The clip name is misleading — it contains two parts:
1. First part: Jason turning on the generator
2. Second part: Jason looks down and sees the Joker card

**Timed SFX cues (per LS_VIDEO_PIPELINE):**
- At 5s — Jason should say "I'm turning it on now"
- At 9s — the flashlight CSS overlay should be **removed permanently** from the rest of the game
- At 13s — Jason should react to the Joker Card on the ground

The card overlay must appear at the **end** of this clip, triggered by a WS `card_discovered` event from the backend. The player can only pick up the card after the reveal clip finishes and the overlay appears.

**Joker Card Idle (`card_joker_01.png`):** Still image extracted from the `card_joker_01` clip. This still is time TRIGGERED, KEYWORD TRIGGERED, and CARD ICON CLICK TRIGGERED. The player must use keywords like "pick up the card" or CLICK the floating card icon to trigger the next scene. Auto-advances after timeout.

**Frontend on `card_discovered({ cardId: 'card1' })`:**

- Floating **Joker Card** overlay appears on screen (animated, collectible)
- GM fires NO further scene/video events until `card_collected({ cardId: 'card1' })` is received
- Jason continues reacting to player speech freely; visual progression pauses

**Player clicks the card overlay:**

- Frontend sends `card_collected({ cardId: 'card1' })` to backend
- Card overlay disappears; card stored in frontend collected state

**Card timeout (per-step timeout for `card_joker_01` hold):**

- If card is not clicked within timeout, Jason auto-collects it.
- During this window, backend emits 9-second silence nudges (`npc_idle_nudge` / `overlay_text`) if player does not speak.

**Card Pickup — `card_pickup_01` (6s, no baked sound):**

- At 0s — Jason should say "okay, I'm picking it up now"
- Ambient sounds should play
- Clip shows Jason picking up the Joker card
- Clip end triggers **WILDCARD 1**

**Backend on `card_collected({ cardId: 'card1' })`:**

- Card collection resolves into the **live wildcard feed pipeline**:
  1. glitch transition
  2. brief black/noise hold
  3. Jason says: _"There's a feed coming in through my glasses. I did not activate this myself."_
  4. small-frame feed playback happens with frontend CSS border
  5. scare SFX triggers with the video
  6. heavy CSS glitch effects + loud SFX scare at end of clip
  7. cut to the next scene (tunnel transition)

**WILDCARD 1 (8s, live-generated):** Uses the player's webcam feed as input. Captures a single frame of the player and environment, then applies it to a Veo 3.1 video generation that adds a shadowy figure in the background behind the player. The player and environment are animated with live action webcam quality movement. Frontend SFX scare when the figure first appears.

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition (universal transition SFX — random variant)
- `[SFX: card_appear]` — subtle card materialization sound (consistent with Slotsky card SFX family)
- `[SFX: scare_wildcard]` — triggers with the wildcard feed video playback

---

## PHASES 6–8

→ **[SHOT_SCRIPT_PART2.md — Phases 6–8: Waterpark, Elevator, Acecard Gate, Endings](SHOT_SCRIPT_PART2.md)**

---


## APPENDICES

→ **[WILDCARD_PROMPTS.md — Imagen 4 Prompts, Veo 3.1 Hints, Prewarm Cache, Card Collectibles, Step Machine](WILDCARD_PROMPTS.md)**

---

_SHOT_SCRIPT.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 3.0 | March 15, 2026_
_Canon. Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md | LS_VIDEO_PIPELINE.md | WS_EVENTS.md | FRONTEND_SPEC.md | SHOT_SCRIPT_PART2.md | WILDCARD_PROMPTS.md_
