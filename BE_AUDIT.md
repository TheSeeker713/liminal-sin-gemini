# FULL AUDIT REPORT: Backend & Docs vs. LS_VIDEO_PIPELINE.md

**Source of Truth:** LS_VIDEO_PIPELINE.md

**Scope:** All backend code in server, all docs in docs, and local asset directories. Frontend is in a separate repo (`myceliainteractive`) and is not present in this workspace; frontend findings are limited to what can be inferred from backend WS events and doc specs.

---

## CRITICAL ISSUES (Runtime Bugs / Broken Gameplay)

### 1. `flashlight_beam` resolves to the wrong media ID

| File | Line | What it says | What pipeline says |
|---|---|---|---|
| gameMaster.ts | `resolveMediaId()` | `flashlight_beam` → `"tunnel_darkness_01"` | `flashlight_beam` → `"flashlight_sweep_01"` |

**Impact:** When the GM fires Beat 2 (`triggerSceneChange({ sceneKey: "flashlight_beam" })`), the scene_change event sent to the frontend contains `mediaId: "tunnel_darkness_01"`. There is **no** `tunnel_darkness_01.mp4` clip, so the frontend would either 404 or display nothing. The first visual moment of the game is broken.

### 2. `tunnel_darkness_01` is referenced as a real media asset — it shouldn't exist

| Location | Problem |
|---|---|
| stepMachine.ts step 8 | `mediaId: "tunnel_darkness_01"` |
| gameMaster.ts MORPHIC_CLIP_IDS | Includes `"tunnel_darkness_01"` |
| gameMaster.ts resolveMediaId | `"flashlight_beam"` → `"tunnel_darkness_01"` |
| gameMaster.ts resolveMediaId | `"tunnel_darkness_01"` → `"tunnel_darkness_01"` (identity mapping) |
| generated_stills | `tunnel_darkness_01.png` exists on disk |

Per LS_VIDEO_PIPELINE step 2: *"This is a live agent audio experience with a static black screen. No video rendering required."* The darkness phase is **CSS black screen only**. There is no `tunnel_darkness_01` clip or still in the pipeline. The `.png` in assets is stale and the code references are wrong.

### 3. `flashlight_sweep_01` is completely absent from `STEP_MEDIA_TRIGGER`

stepMachine.ts — `STEP_MEDIA_TRIGGER` has no entry for `flashlight_sweep_01`. Per LS_VIDEO_PIPELINE step 3 and SHOT_STEPS.md step 7, this is a 10s muted clip that should be step 7 in the step machine. Currently step 7 has no STEP_MEDIA_TRIGGER entry at all, and step 8 maps to the non-existent `tunnel_darkness_01`.

### 4. Step 8 autoplay fires non-existent scene key `flashlight_scanning`

stepMachine.ts — `STEP_AUTOPLAY_ACTIONS[8]` fires `triggerSceneChange({ sceneKey: "flashlight_scanning" })`. The key `"flashlight_scanning"` does not exist in the Scene Key Registry, SHOT_STEPS.md, or LS_VIDEO_PIPELINE. `resolveMediaId()` would fall through to `default: return sceneKey` and emit a non-existent media ID to the frontend. The correct media for this step is `tunnel_flashlight_01`.

### 5. `maintenance_reveal_01` is completely missing from the step machine

LS_VIDEO_PIPELINE step 16: `maintenance_reveal_01` (15s) plays when keywords like "look around" trigger after the park liminal still. SHOT_STEPS.md has it as step 25 (chained_auto, 30s). But stepMachine.ts jumps directly from step 16 (`park_liminal_01`) → step 17 (`shaft_maintenance_01`). The `maintenance_reveal_01` clip is **skipped entirely** in the step machine sequence.

### 6. `jasonReadyTimer` duration mismatch

| Source | Duration |
|---|---|
| LS_VIDEO_PIPELINE step 2 | 15–30 seconds |
| SHOT_SCRIPT Phase 3 | 18 second gate |
| server.ts `jasonReadyTimer` | **10 seconds** |

Player audio opens at 10s instead of the specified 15–30s, cutting Jason's landing monologue short and potentially allowing player audio to bleed in during the scripted intro.

---

## HIGH-PRIORITY ISSUES (Lore Violations / Wrong Data)

### 7. Card names are wrong in gmTools.ts

gmTools.ts — `triggerCardDiscovered` description says:
> card1 = "Jack of Clubs", card2 = "Queen of Spades"

Per LS_VIDEO_PIPELINE:
- Card 1 = **Joker** card (step 7: `card_joker_01`)
- Card 2 = **Ace** card (step 24: `acecard_reveal_01`)

Per WILDCARD_PROMPTS Appendix D: Card 1 = Joker, Card 2 = Ace.

The GM sees these descriptions and could narrate the wrong card names to Jason, corrupting the player experience.

### 8. Card name wrong in `SCENE_VISUAL_CONTEXT`

keywordLibrary.ts — `card2_pickup_pov` context says:
> "You see the second card — the **Queen of Spades** — exposed on a surface."

Should be: **"the Ace card"** per LS_VIDEO_PIPELINE step 24.

### 9. GM playbook references wrong card names

gemini.ts — `getGameMasterSystemPrompt()` Beat 7 and Beat 7B reference card2 without specifying the card name, but the GM's tool description (from gmTools.ts) would tell it "Queen of Spades". This compounds issue #7.

### 10. Missing hallway_pov_02 visual hint text

LS_VIDEO_PIPELINE step 23: *"the panel is hidden and the Player will not likely know to look for it, so JASON must give the player a hint, and there should be a visual text hint fade in and out... The hint should appear immediately because this is a Game Over scene event."*

SHOT_SCRIPT_PART2 Phase 7B also flags this as **"VISUAL HINT REQUIRED"**.

The backend code at step 21→22 (hallway_pov_02) fires `startAcecardKeywordTimer` but sends **no `hint` or `overlay_text` event** with text like "Maybe there's a panel somewhere?". The player has 30 seconds to find a hidden trigger with no guidance.

### 11. Step 16 keyword list missing "look around"

LS_VIDEO_PIPELINE step 15: `park_liminal_01.png` still — keyword **"look around"** triggers the next scene.

keywordLibrary.ts step 16 keywords: `["shaft", "maintenance", "go in", "enter", "down there", "ladder", "climb", ...]` — **"look around" is not in this list**.

---

## MEDIUM-PRIORITY ISSUES (Missing Features / Incomplete Implementation)

### 12. No per-clip timed SFX/dialogue injection system

LS_VIDEO_PIPELINE specifies extensive per-clip timed cues. Examples:
- `tunnel_flashlight_01`: at 3s walking SFX starts, at 7s Jason reacts to generator, at 12s stop walking SFX
- `card_joker_01`: at 5s Jason says "I'm turning it on now", at 9s flashlight CSS removed permanently, at 13s Jason reacts to card
- `park_reveal_01`: at 9s full screen CSS glitch for 1s
- `elevator_inside_02`: at 4s a 2s full screen CSS glitch

**None of these timed intra-clip events are implemented.** There is no backend system to emit time-offset events within a playing clip. The frontend would need to handle this via clip-specific timers, but no WS events drive the timing.

### 13. Missing flashlight CSS overlay removal event

LS_VIDEO_PIPELINE step 7 (`card_joker_01`): *"at 9s — the flashlight CSS overlay should be removed permanently from the rest of the game"*

No backend event is emitted to tell the frontend to permanently remove the flashlight CSS overlay. This should be a new WS event or a property on the scene_change payload.

### 14. Missing white CSS fade for `tunnel_transition_01`

LS_VIDEO_PIPELINE step 11: *"The clip should have a white CSS animated #FFFFFF fade into the scene. No glitch effects, no scare SFX. Just a clean fade."*

No WS event or metadata is sent to the frontend to trigger a white fade instead of the standard `glitch_low` transition SFX. The frontend would apply the universal `glitch_low` on scene_change, which directly contradicts the pipeline spec.

### 15. Radio static SFX volume/frequency issue (Frontend)

LS_VIDEO_PIPELINE note: *"There is too much radio static SFX when the player talks and when Jason talks. It is also too loud. Either lower the volume for the specific static SFX, or reduce the frequency of them being triggered."*

This is a known frontend issue flagged in the pipeline spec. Cannot verify from this workspace but should be tracked.

### 16. `prewarmImageCache` generates Imagen images for scripted scenes

imagen.ts — `prewarmImageCache()` calls `generateSceneImage()` for `flashlight_beam`, `generator_area_start`, `park_entrance`. This generates fresh Imagen 4 images at runtime.

Per LS_VIDEO_PIPELINE and SHOT_SCRIPT: *"Scripted media is never re-generated at runtime. All scripted stills and clips are pre-built Morphic files served from GCS."* These Imagen calls are unnecessary API spend for Jason's visual context when the Morphic stills already exist on GCS and could be loaded instead.

Additionally, `flashlight_beam` resolves to the wrong prompt (see issue #1), so the prewarmed image wouldn't match the actual visual.

---

## DOC DISCREPANCIES (Docs vs. LS_VIDEO_PIPELINE)

### 17. SHOT_STEPS.md step 17: `tunnel_to_park_transition` listed as `hold_for_input`

SHOT_STEPS.md Step Machine Registry step 17 says `hold_for_input` with "STILL hold at start; advance → 19".

LS_VIDEO_PIPELINE step 11 says `tunnel_transition_01` *"plays immediately after the wildcard scare"* — meaning auto-play (chained_auto). The code in stepMachine.ts step 12 correctly uses `chained_auto`. SHOT_STEPS.md is wrong.

### 18. WILDCARD_PROMPTS `wildcard_vision_feed` Imagen prompt differs from imagen.ts

WILDCARD_PROMPTS.md Appendix A has a detailed "smartglasses HUD" prompt for `wildcard_vision_feed`.

imagen.ts has a completely different prompt focusing on "real photograph" and "shadow on the wall".

The code prompt is likely more current, but the doc hasn't been updated to match.

### 19. WILDCARD_PROMPTS `wildcard_good_ending` Imagen prompt differs from imagen.ts

WILDCARD_PROMPTS.md Appendix A has a prompt mentioning "distant figure (Audrey)" in the waterpark.

imagen.ts has a different prompt: "lounge chair overlooking the beautiful majestic scenery" with "Shot on 35mm film."

Same issue — doc not updated to match live code.

### 20. CURRENT_STATE.md claims "Backend Status — 100% COMPLETE"

CURRENT_STATE.md states:
> Backend Status — 100% COMPLETE... Zero TypeScript errors. Zero ESLint errors.

This contradicts the multiple critical issues found above (wrong media IDs, missing steps, wrong card names). The backend compiles without errors, but the runtime behavior doesn't match LS_VIDEO_PIPELINE.

---

## ASSET DISCREPANCIES

### 21. Stale `tunnel_darkness_01.png` in assets

assets/generated_stills/tunnel_darkness_01.png exists on disk. Per LS_VIDEO_PIPELINE, the darkness phase is CSS black screen only — this file is not referenced by the pipeline and should not exist. CURRENT_STATE.md says 15 stills; assets has 16 files (the 16th is this stale file).

### 22. Missing keyword entries for card pickup hold steps

LS_VIDEO_PIPELINE step 8 (`card_joker_01.png`): keyword "pick up the card" should trigger the next scene. Step 25 (`card_pickup_02.png`): same keyword.

keywordLibrary.ts `STEP_KEYWORDS` has no entries for the card hold steps (step 11 and step 22 in stepMachine). While the card_collected event and acecard gate handle progression, the pipeline explicitly lists voice commands as a trigger mechanism alongside click — the keyword listener doesn't cover these.

---

## STEP NUMBER ALIGNMENT (Code vs. Docs)

The step machine in stepMachine.ts uses step numbers 7–22. SHOT_STEPS.md uses step numbers 7–31. The mapping doesn't align:

| Pipeline Step | SHOT_STEPS Step | stepMachine Step | mediaId | Alignment |
|---|---|---|---|---|
| 3 (flashlight_sweep) | 7 | **missing** | `flashlight_sweep_01` | Code missing |
| 4 (tunnel_flashlight) | 8 | 8 → wrong media | `tunnel_darkness_01` should be `tunnel_flashlight_01` | **WRONG** |
| 5 (tunnel_generator) | 9 | 9 | `tunnel_flashlight_01` | OK |
| 6 (generator still) | 11 | 10 | `tunnel_generator_01` | OK |
| 7 (card_joker) | 13 | 11 | `card_joker_01` | OK |
| 11 (tunnel_transition) | 17 | 12 | `tunnel_transition_01` | OK |
| 12 (park_reveal) | 19 | 13 | `park_reveal_01` | OK |
| 13 (park_walkway_01) | 21 | 14 | `park_walkway_01` | OK |
| 14 (park_walkway_02) | 23 | 15 | `park_walkway_02` | OK |
| 14a (park_liminal) | 24 | 16 | `park_liminal_01` | OK |
| 16 (maintenance_reveal) | 25 | **missing** | `maintenance_reveal_01` | **Code missing** |
| 17 (shaft_maintenance) | 26 | 17 | `shaft_maintenance_01` | OK |
| 18 (elevator_entry still) | 27 | 18 | `elevator_entry_01` | OK |
| 19 (elevator_entry clip) | — | — | (handled by hold_for_input advance) | OK |
| 20 (elevator_inside_01) | 28 | 19 | `elevator_inside_01` | OK |
| 21 (elevator_inside_02) | 29 | 20 | `elevator_inside_02` | OK |
| 22 (hallway_pov_01) | 30 | 21 | `hallway_pov_01` | OK |
| 23 (hallway_pov_02 still) | 31 | 22 | `hallway_pov_02` | OK |

---

## SUMMARY

| Severity | Count | Key Issues |
|---|---|---|
| **CRITICAL** (broken gameplay) | 6 | `flashlight_beam` → wrong media, `tunnel_darkness_01` ghost references, `flashlight_sweep_01` missing from step machine, `flashlight_scanning` non-existent scene key, `maintenance_reveal_01` missing from step machine, `jasonReadyTimer` 10s vs 15–30s |
| **HIGH** (lore violations) | 5 | Card names wrong in gmTools/keywordLibrary/gemini prompt, missing hallway hint, missing "look around" keyword |
| **MEDIUM** (missing features) | 5 | No timed SFX system, no flashlight CSS removal event, no white fade event, radio static volume, wasteful Imagen prewarm |
| **DOC** (stale docs) | 4 | SHOT_STEPS trigger type error, wildcard prompt mismatches, CURRENT_STATE "100% complete" claim |
| **ASSET** | 2 | Stale `tunnel_darkness_01.png`, missing keyword entries for card holds |

**No code was edited or written in this session. This is a read-only audit.**