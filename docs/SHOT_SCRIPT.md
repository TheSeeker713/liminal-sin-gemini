# SHOT_SCRIPT.md — Liminal Sin Act 1 Director's Blueprint
## Version 1.0 | March 11, 2026
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

| Key | Phase | Status | Notes |
|---|---|---|---|
| `flashlight_beam` | Phase 5 | ✅ Existing | First visual; darkness → first light |
| `generator_area` | Phase 5B | ✅ Existing | Joker card at generator base |
| `park_entrance` | Phase 6 | ✅ **New** | Functional paradise waterpark crashes into tunnel |
| `park_walkway` | Phase 6B | ✅ **New** | Jason exploring park; maintenance shaft visible in distance |
| `maintenance_area` | Phase 7 | ✅ Existing | Industrial corridor; neon park glow behind |

---

## WS EVENT REGISTRY

Extends the contract defined in `CURRENT_STATE.md`. Items marked ⚠️ Backend TBD are new events not yet wired in `server.ts` / `gameMaster.ts`.

| Event | Direction | Payload | Status |
|---|---|---|---|
| `intro_complete` | FE→BE | `{}` | ✅ Existing |
| `player_speech` | FE→BE | `{ audio: base64 }` | ✅ Existing |
| `player_frame` | FE→BE | `{ jpeg: base64 }` | ✅ Existing |
| `session_ready` | BE→FE | `{ session_id: string }` | ✅ Existing |
| `agent_speech` | BE→FE | `{ agent: 'jason'\|'audrey', audio: base64 }` | ✅ Existing |
| `agent_interrupt` | BE→FE | `{ agent: 'jason' }` | ✅ Existing |
| `trust_update` | BE→FE | `{ trust_level: number, fear_index: number }` | ✅ Existing |
| `hud_glitch` | BE→FE | `{ intensity: string, duration_ms: number }` | ✅ Existing |
| `scene_change` | BE→FE | `{ payload: { sceneKey: string } }` | ✅ Existing |
| `scene_image` | BE→FE | `{ payload: { sceneKey, data: base64 } }` | ✅ Existing |
| `scene_video` | BE→FE | `{ payload: { sceneKey, url: string } }` | ✅ Existing |
| `slotsky_trigger` | BE→FE | `{ payload: { anomalyType: string } }` | ✅ Existing |
| `hint` | BE→FE | `{ text: string }` | ✅ Existing |
| `player_speak_prompt` | BE→FE | `{}` | ✅ Existing |
| `overlay_text` | BE→FE | `{ payload: { text: string, variant: string, durationMs: number } }` | ✅ Existing |
| `npc_idle_nudge` | BE→FE | `{ payload: { phase: string, secondsSilent: number, urgency: 'soft'\|'urgent' } }` | ✅ Existing |
| `autoplay_advance` | BE→FE | `{ payload: { fromStep: number, toStep: number, reason: 'timeout'\|'npc_choice' } }` | ✅ Existing |
| `audience_update` | BE→FE | `{ payload: { personCount, groupDynamic, observedEmotions } }` | ✅ Existing |
| `card_discovered` | BE→FE | `{ cardId: 'card1'\|'card2' }` | ✅ Existing |
| `card_collected` | FE→BE | `{ cardId: 'card1'\|'card2' }` | ✅ Existing |
| `dread_timer_start` | BE→FE | `{ durationMs: number }` | ✅ Existing |
| `game_over` | BE→FE | `{}` | ✅ Existing |
| `good_ending` | BE→FE | `{}` | ✅ Existing |

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

| Beat | Trigger | GM Function Calls | Duration |
|---|---|---|---|
| 1 — DARKNESS | Session start | `triggerAudienceUpdate`, `triggerTrustChange` (once) | 0:00–~0:40 |
| 2 — FLASHLIGHT ON | Player mentions light / visibility | `triggerSceneChange("flashlight_beam")`, `triggerVideoGen("flashlight_beam")` | ~0:40–~1:00 |
| 3 — GENERATOR / JOKER CARD | Player guides Jason to generator | `triggerSceneChange("generator_area")`, `triggerVideoGen("generator_area")`, `card_discovered({cardId:'card1'})` | ~1:00–~1:30 |
| 4 — WATERPARK ENTRANCE | Player tells Jason to start generator | `triggerSceneChange("park_entrance")`, `triggerVideoGen("park_entrance")` | ~1:30–~2:00 |
| 5 — WATERPARK INTERIOR | Player / Jason explores the park | `triggerSceneChange("park_walkway")`, `triggerVideoGen("park_walkway")` | ~2:00–~2:30 |
| 6 — MAINTENANCE DISCOVERY | Player guides Jason to maintenance shaft | `triggerSceneChange("maintenance_area")`, `triggerVideoGen("maintenance_area")`, `dread_timer_start({durationMs:60000})`, `triggerAudreyVoice` (distant cue) | ~2:30–~3:00 |
| 7 — CARD 2 HUNT | Jason searches; player instructs | `card_discovered({cardId:'card2'})` | ~3:00–~3:30 |
| 8 — ENDING | Card 2 collected before timer expires | `triggerSlotsky("found_transition")` | ~3:30–~4:00 |

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
4. **If denied:** display — *"This experience requires camera and microphone. Refresh to try again."*
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
- Example: *"Okay. I've got the flashlight. I can see— concrete. Just concrete. It goes a long way."*

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
- Still: generator area with joker card visible at the base
- Video: Veo animation covers both the generator discovery and the card reveal in one sequence (flashlight sweeps down to card; generator activation vibration if player instructed it)

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
- GM injects a SITUATION_UPDATE into Jason with the player's appearance (GM vision from webcam)
- This is the **AI Vision Proof moment** — proves to the player that Jason can see them
- Injection format:
  ```
  [SITUATION_UPDATE: GM_VISION — You have a sudden disorienting flash of partial sight
  through the device. You sense — or see — the person on the other end for one moment.
  Describe exactly ONE specific visual detail about them: what they are wearing, their
  hair, one concrete thing you noticed. Then ask: "Are you wearing a ___?" or
  "I saw — are you [descriptive detail]?" React as if this is real and shocking.
  One moment of recognition, then it is gone. Maximum 2 sentences total.]
  ```
- If no camera feed is available: Jason acknowledges his smartglasses feed lit up but he cannot see anyone; addresses player by name or nickname
- Frontend triggers: `hud_glitch` + brief warped player image flash on screen

**Jason's scripted moment:**
> *"I just— I had a flash. Are you wearing [detail the GM saw]?"*

This proves to the player: the AI can hear them AND see them. The player can interrupt it (barge-in is active). Core contest proof-of-concept.

**SFX:**
- `[SFX: glitch_low]` — fires on scene transition to `generator_area` (universal transition SFX — random variant)
- `[SFX: card_appear]` — subtle card materialization sound (consistent with Slotsky card SFX family)
- `[SFX: static_burst]` — brief smartglasses/device static on the vision flash moment

---

## PHASE 6 — GENERATOR ON: WATERPARK ENTRANCE

**[Beat 4 — Paradise Reveal]**

**Trigger (GM):** Player tells Jason to start the generator / Jason powers it on.

**GM calls (in order):**
1. `triggerSceneChange({ sceneKey: "park_entrance" })`
2. `triggerVideoGen({ sceneKey: "park_entrance" })`
3. `triggerFearChange({ newFearLevel: 0.3, reason: "player reacts to the impossible beauty" })` — optional

**Screen:** Transitions from the industrial generator area to the full paradise reveal. The waterpark is **not abandoned**. It is functional, beautiful, and perfect — it looks like a paradise waterpark that has simply crashed through a concrete wall. Vivid neon, clean slides, working pool systems, real tropical plants.

**Jason in character (free dialogue):**
> *"Oh my god. There's— it's a water park. It's running. The lights are on."*
> *(beat)*
> *"...It's beautiful. Why is it down here?"*

**SFX:**
- `[SFX: glitch_low]` — fires on scene transition to `park_entrance` (universal transition SFX — random variant)
- `[SFX: generator_start]` — industrial generator spool-up, 4 seconds, fires on scene transition
- `[SFX: neon_hum]` — faint electrical neon hum, low, continuous under this phase
- `[SFX: drip_loop]` — continues but shifts register (now mixed with the neon environment)

---

## PHASE 6B — WATERPARK INTERIOR

**[Beat 5 — Scale Reveal]**

**Trigger (GM):** Player tells Jason to explore / Jason advances on his own.

**GM calls (in order):**
1. `triggerSceneChange({ sceneKey: "park_walkway" })`
2. `triggerVideoGen({ sceneKey: "park_walkway" })`

**Screen:** Jason is on the dry walkways of the park, moving between operating water features. THIS WATERPARK IS HUGE — the scale of an actual outdoor theme park, but underground. Cascading waterfalls, lazy rivers, curving slides, lit pools. In the far background: a maintenance corridor entrance cut into the cavern wall.

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
1. `triggerSceneChange({ sceneKey: "maintenance_area" })`
2. `triggerVideoGen({ sceneKey: "maintenance_area" })`
3. `dread_timer_start({ durationMs: 60000 })` — 60-second countdown, invisible, starts immediately
4. `triggerAudreyVoice` — a distant female voice fires at the moment of maintenance discovery
5. `card_discovered({ cardId: 'card2' })` — fires once Jason begins actively searching

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

**Card 2 overlay (Queen of Spades):**
- Floating overlay appears on screen when Jason uncovers the card location
- Same mechanic as Card 1: player clicks → `card_collected({ cardId: 'card2' })` FE→BE → Phase 8

**Card 2 timeout (60s):**
- If card is not collected before the dread timer expires, Jason makes an autonomous choice.
- Timer outcome is deterministic: timer expiry → game over; card before expiry → good ending.

---

### GAME OVER BRANCH (timer expires before Card 2 collected)

**Trigger:** Backend dread timer reaches 0 — sends `game_over` — **[⚠️ Backend TBD]**

1. `[SFX: monster_sound1]` + `[SFX: monster_sound2]` triggered simultaneously — loud, close, in-ear, one hit (the invisible presence arrives)
2. Silence. Total.
3. Screen fades to black (2s)
4. Text appears (white on black, centered):
   ```
   GAME OVER.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```
5. Jason: **says nothing**. His silence is the ending.
6. Session is dead. Browser refresh to restart.

---

## PHASE 8 — THE ENDING (Card 2 Found)

**[Beat 8 — "To Be Continued"]**

**Trigger:** Frontend sends `card_collected({ cardId: 'card2' })` to backend.

**GM calls (in order):**
1. `triggerAudreyVoice({ trustLevel: <current_trust_level> })` — if not already fired in Beat 6
2. `triggerSlotsky({ anomalyType: "found_transition" })` — **ONE-WAY DOOR. No GM calls after this.**

**No new scene change.** The ending plays out over the `maintenance_area` scene — Jason holds the card in his hand, still in the industrial corridor. No close-up. No new camera angle. His POV.

**Audrey's voice (trust-adaptive):**
Note: Jason's trust score is the only input to Audrey's dialogue. Fear index has no impact.
| Trust | Audrey's line |
|---|---|
| ≥ 0.7 (High) | *"Jason?"* — soft, hopeful, as if she just heard something. She says his name. |
| 0.4–0.69 (Neutral) | One short sentence, muffled and echoing. Scared but present. |
| < 0.4 (Low) | Quiet crying. No name. A single exhale of despair. She sounds very far away. |

**SFX:**
- `[SFX: found_water_rise]` — the Nature Vault water sound from deep below; vast, slow-moving, rising from beneath. Beautiful. Wrong. Rises then fades over ~8 seconds. (random variant from `found_water_rise` pool)
- Audrey's voice plays over this wash.

**Screen transition:**
1. `maintenance_area` scene fades slowly to black (4s)
2. Over black, text appears (white on black, centered):
   ```
   TO BE CONTINUED.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```
3. Backend sends `good_ending` ✅
4. Frontend shows `[PLAY AGAIN]` button after 5s

**Jason (optional closing line — free character choice):**
- He goes quiet as the smartglasses app signal fades to static.
- He may say nothing. Or: *"...I'll find them."*
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
const PREWARM_SCENE_KEYS = ['flashlight_beam', 'generator_area', 'zone_park_shore'] as const;
```

**Rationale:** `flashlight_beam` is the first visual moment (Beat 2), and `generator_area` follows immediately in the primary flow, so both are prewarmed. `zone_park_shore` remains the first large reveal anchor. `maintenance_area` and `card2_closeup` are later-game beats where on-demand generation has enough time to complete.

---

## APPENDIX D — CARD COLLECTIBLES SPEC

| Card | ID | Visual | Phase | Contains |
|---|---|---|---|---|
| Card 1 | `card1` | Jack of Clubs | Phase 5B (Beat 3) | AI vision proof — Jason describes player appearance |
| Card 2 | `card2` | Queen of Spades | Phase 7 (Beat 5) | Session ending trigger — routes to good ending |

Both cards are standard playing cards (same visual language as the `slotsky_card` three-card anomaly in Beat 5). The jack of clubs appears alone in the `generator_area` scene image, isolated in the flashlight spotlight. The queen of spades appears as the floating collectible overlay in Phase 7 and becomes the `card2_closeup` final image.

---

*SHOT_SCRIPT.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Version 1.0 | March 11, 2026*
*Canon. Cross-reference: AGENTS.md | WORLD_BIBLE.md | Gamemaster.md | Characters.md*
