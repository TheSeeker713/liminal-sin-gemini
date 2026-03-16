# FRONTEND AUDIT REPORT — myceliainteractive vs. LS_VIDEO_PIPELINE.md

**Auditor:** GitHub Copilot | **Date:** March 15, 2026  
**Source of truth:** LS_VIDEO_PIPELINE.md  
**Frontend root:** `D:\DEV\Coding Projects\Company and business projects\myceliainteractive`

---

## CRITICAL — Breaks the game flow

### 1. `flashlight_sweep_01` does not exist in the frontend

The pipeline defines `flashlight_sweep_01` (step 3) as the **first visual clip of the entire game** — 10s, muted, plays on the "flashlight" keyword trigger. This clip ID is **nowhere** in the frontend:
- Not in `MORPHIC_MEDIA_IDS`
- Not in `MORPHIC_CLIP_IDS`
- Not referenced in any `.ts` or `.tsx` file

When the backend sends a `scene_change` with `mediaId: "flashlight_sweep_01"`, the frontend will **silently ignore it** because it doesn't match any known Morphic media. The game's first visual moment never appears.

### 2. ALL clips are force-muted — pipeline says only `flashlight_sweep_01` should be muted

In useGameHudGeneralEffects.ts: `video.muted = true` is applied to **every** clip played via `scene_change`. In useGameHudScenarioEffects.ts: acecard clips are also `muted = true`. The `<video>` element in SceneVisualLayers.tsx also has a hardcoded `muted` attribute.

The pipeline explicitly says:
| Clip | Pipeline directive |
|---|---|
| `flashlight_sweep_01` | **muted** — "this is the only clip that should be muted" |
| `tunnel_transition_01` | "This clip has sound - **DO NOT MUTE**" |
| `park_reveal_01` | "This clip has sound - **DO NOT MUTE**" |
| `park_walkway_01` | "This clip has sound - **DO NOT MUTE**" |
| `elevator_inside_02` | "This clip has sound - **DO NOT MUTE**" |
| `hallway_pov_01` | "This clip has sound - **DO NOT MUTE**" |
| `acecard_reveal_01` | "This clip has sound - **DO NOT MUTE**" |
| `card_pickup_02` | "This clip has sound - **DO NOT MUTE**" |

7 clips with built-in audio are having their sound silenced. The `audioMode` field exists in the `SceneVideoEvent` type definition but is **never read or applied** during playback.

### 3. No per-clip timed SFX or event system exists

The pipeline specifies **precise second-level cued events** for nearly every clip. Examples:
- `tunnel_flashlight_01`: Walking SFX at 3s, Jason reacts at 7s, stop walking at 12s
- `card_joker_01`: Jason speaks at 5s, flashlight CSS removed at 9s, card reaction at 13s
- `park_reveal_01`: Full-screen CSS glitch at 9s for 1s
- `elevator_inside_02`: 2s full-screen CSS glitch at 4s

The frontend's `handleVideoTimeUpdate` in useSceneCallbacks.ts only checks if the video is near the end (for VHS swap animation). **No timed SFX cues, no timed CSS effects, no timed dialogue triggers** — the entire per-clip event system is missing.

### 4. Wrong card identities

Pipeline spec:
- Card 1 (steps 7-9): **Joker Card**
- Card 2 (steps 24-27): **Ace Card**

Frontend CardCollectibleOverlay.tsx:
- card1 → rank "J", suit "♣" = **"Jack of Clubs"** (wrong — should be Joker)
- card2 → rank "Q", suit "♠" = **"Queen of Spades"** (wrong — should be Ace)

---

## HIGH — Materially degrades the experience

### 5. Missing white fade transition for `tunnel_transition_01`

Pipeline step 11: *"The clip should have a white CSS animated #FFFFFF fade into the scene. No glitch effects, no scare SFX. Just a clean fade into this scene."*

- No white fade CSS class or animation exists anywhere in the frontend
- The universal `glitch_low` SFX fires on **every** `scene_change` event (useGameHudGeneralEffects.ts), directly contradicting "no glitch effects" for this scene

### 6. Missing `QUIT GAME` button on end screens

Pipeline steps 26 & 28 both specify two buttons: `[PLAY AGAIN]` and `[QUIT GAME]`. The QUIT GAME button should return the player to `/ls`.

DemoEndOverlay.tsx has:
- "Play Again" button — present
- "Stop Camera & Microphone" button — **wrong label, wrong behavior** (should be "QUIT GAME" navigating to `/ls`)

### 7. Walking/footstep SFX not integrated

`footsteps_walk_loop.mp3` exists in `public/assets/sound_fx/` but:
- Has **no entry** in audioManifest.ts
- No logic to start/stop walking SFX during clip playback
- Pipeline requires walking SFX on `flashlight_sweep_01`, `tunnel_flashlight_01` (3s–12s), `tunnel_generator_01` (1.5s–10s), and `park_walkway_02`

### 8. `floor_crack` SFX not used at credits fade-out

Pipeline Phase 2: *"[SFX: floor_crack] — fires ONCE as the final credit fades out (not randomized; this is the noclip moment)"*

- `floor_crack.mp3` exists on disk
- Not in audioManifest.ts
- IntroSequence.tsx fires `descent_sting` at t=17.8s instead of `floor_crack`

### 9. `structural_hum` SFX missing entirely

Pipeline Phase 3: *"[SFX: structural_hum] — very low building hum, begins at Phase 3 start"*

- No file exists
- No audio manifest entry
- Not triggered anywhere

### 10. `water_fountain` and `wet concrete` SFX missing

Pipeline step `park_walkway_02`: *"water fountain SFX | walking on wet concrete SFX"*

- No files exist
- No audio manifest entries
- Not triggered

### 11. Radio static SFX volume/frequency issue acknowledged in pipeline but not addressed

Pipeline note: *"There is too much radio static SFX when the player talks and when Jason talks. It is also too loud."*

In useAgentAudio.ts, `transmission_ping` (radio static) fires on every Jason speech burst start. The `barge_in` key (same radio_static pool) also fires on every `agent_interrupt`. Volume is 0.7 × 0.6 (SFX channel gain). No frequency throttle exists.

---

## MEDIUM — Functional but incorrect per spec

### 12. `tunnel_darkness_01` is in `MORPHIC_CLIP_IDS` but shouldn't be

Pipeline step 2: *"This is a live agent audio experience with a static black screen. No video rendering required."*

mediaManifest.ts lists `tunnel_darkness_01` in both `MORPHIC_MEDIA_IDS` and `MORPHIC_CLIP_IDS`. If the backend sends a `scene_change` for this, the frontend will attempt to load a `.mp4` from GCS for what should be a CSS black screen.

### 13. `hallway_pov_02` is in `MORPHIC_CLIP_IDS` but it's a still

Pipeline step 23: `hallway_pov_02.png` — *"Still image extracted from the hallway_pov_01 clip."*

It's correctly in `MORPHIC_MEDIA_IDS` but **incorrectly** in `MORPHIC_CLIP_IDS`, causing the frontend to try loading `hallway_pov_02.mp4` (which doesn't exist) instead of `hallway_pov_02.png`.

### 14. `acecard_reveal_01` missing from `MORPHIC_CLIP_IDS`

Pipeline step 24: `acecard_reveal_01` is a 15s `.mp4` clip. It's in `MORPHIC_MEDIA_IDS` but not in `MORPHIC_CLIP_IDS`. The `acecard_reveal_start` handler builds its own URL so this path works, but the standard `scene_change` flow for this media would show a still instead of a clip.

### 15. `park_reveal_01` missing full-screen CSS glitch at 9s

Pipeline step 12: *"at 9s - there needs to be a full screen css animated glitch and noise effect for 1s then gone."*

No timed CSS event system — this glitch never fires.

### 16. `elevator_inside_02` missing 2s CSS glitch at 4s

Pipeline step 21: *"A 2s full screen CSS glitch and noise should occur here and end."*

No timed CSS event system — this glitch never fires.

### 17. Flashlight CSS overlay removal not timed to 9s of `card_joker_01`

Pipeline step 7: *"at 9s - the flashlight CSS overlay should be removed permanently"*

The frontend removes the vignette (via `generatorLit`) when ANY `POST_TUNNEL_IDS` scene plays — this happens at scene transition, not at the specific 9s mark within the `card_joker_01` clip.

### 18. Game over subtitle text duplicated

DemoEndOverlay.tsx shows "thank you for playing liminal sin" twice — once as the subtitle and once as an extra line below it.

---

## LOW — Cosmetic / robustness

### 19. SFX files reference GCS but may not exist there

All audio in audioManifest.ts points to `https://storage.googleapis.com/liminal-sin-assets/audio/sfx/`. Some of these files (e.g., `card_appear.mp3`, `card_appear_2.mp3`) don't exist in the local `public/assets/sound_fx/` directory and may not have been uploaded to GCS. The system degrades silently (no crash), but the SFX won't play.

### 20. `drip_loop` ambient name doesn't match

Pipeline references `[SFX: drip_loop]` as a distinct looping ambient. The audioManifest uses `ambient_cold_open` which pools both `cold_open_drip_*` and `sfx_drip_tunnel_*` variants — functionally similar but the naming doesn't correspond.

### 21. `PRELOAD_STILLS` only loads 3 stills

The array preloads `tunnel_darkness_01`, `tunnel_flashlight_01`, `tunnel_generator_01`. No park-related stills are preloaded, which may cause visible loading delays for later scenes.

---

## SUMMARY TABLE

| # | Severity | Finding | Pipeline Step |
|---|---|---|---|
| 1 | **CRITICAL** | `flashlight_sweep_01` not in frontend at all | 3 |
| 2 | **CRITICAL** | All clips force-muted; 7 clips should have audio | 3,11,12,13,21,22,24,27 |
| 3 | **CRITICAL** | No per-clip timed SFX/CSS/event system | 3-27 |
| 4 | **CRITICAL** | Card identities wrong (Jack/Queen vs Joker/Ace) | 7-9, 24-27 |
| 5 | HIGH | No white fade for tunnel_transition_01 | 11 |
| 6 | HIGH | QUIT GAME button missing / wrong label | 26, 28 |
| 7 | HIGH | Walking SFX not in audio system | 3,4,5,14 |
| 8 | HIGH | floor_crack SFX not used at credits end | Phase 2 |
| 9 | HIGH | structural_hum SFX missing entirely | Phase 3 |
| 10 | HIGH | water_fountain / wet concrete SFX missing | 14 |
| 11 | HIGH | Radio static too frequent / loud (noted in pipeline) | Note |
| 12 | MEDIUM | tunnel_darkness_01 incorrectly in CLIP_IDS | 2 |
| 13 | MEDIUM | hallway_pov_02 incorrectly in CLIP_IDS (is a still) | 23 |
| 14 | MEDIUM | acecard_reveal_01 missing from CLIP_IDS | 24 |
| 15 | MEDIUM | park_reveal_01 glitch at 9s not implemented | 12 |
| 16 | MEDIUM | elevator_inside_02 glitch at 4s not implemented | 21 |
| 17 | MEDIUM | Flashlight overlay removal not timed to 9s | 7 |
| 18 | MEDIUM | Game over subtitle text duplicated | 26 |
| 19 | LOW | SFX GCS references may 404 silently | All |
| 20 | LOW | drip_loop ambient naming mismatch | Phase 3 |
| 21 | LOW | PRELOAD_STILLS too narrow | — |

**4 CRITICAL / 7 HIGH / 6 MEDIUM / 3 LOW = 20 total findings**   

Completed: *Compile full audit report* (11/11)