# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 15, 2026 (Doc audit — SHOT_SCRIPT split + SHOT_STEPS v2.0 + LS_VIDEO_PIPELINE alignment).

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00082-wzp` — serving 100% traffic |
| GCP Project | `project-c4c3ba57-5165-4e24-89e` (Mycelia Interactive) |
| Org | `digitalartifact11-org` (165684325504) |
| GM model | `gemini-live-2.5-flash-native-audio` (via `GM_LIVE_MODEL` env var) |
| NPC model | `gemini-live-2.5-flash-native-audio` (default in `LiveSessionManager`) |
| Imagen model | `imagen-4.0-generate-001` / `us-west1` |
| Veo model | `veo-3.1-fast-generate-001` / `us-central1` (NOT us-west1) |
| Auth | Service account (Vertex AI) — SA auth works fine; org blocks API keys |
| GCS Media Bucket | `gs://liminal-sin-assets` (us-west1, uniform bucket-level access, public reads) |
| GCS Base URL | `https://storage.googleapis.com/liminal-sin-assets/` |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4, deployed to Cloudflare Pages |
| Frontend route | `/ls/game/` within Mycelia Interactive site |

---

## Current Live State (March 15, 2026 — DOC AUDIT + MEDIA UPDATE)

### Doc Audit — SHOT_SCRIPT split + SHOT_STEPS v2.0 + LS_VIDEO_PIPELINE alignment
- **SHOT_SCRIPT.md v3.0:** Revised against LS_VIDEO_PIPELINE.md (the authoritative video pipeline doc). All contradictions resolved. Split into 5 focused docs:
  - `SHOT_SCRIPT.md` (388 lines) — Overview, GM Playbook, Phases 1–5B
  - `SHOT_SCRIPT_PART2.md` (291 lines) — Phases 6–8 (waterpark through endings)
  - `WS_EVENTS.md` (80 lines) — WebSocket event registry + Slotsky anomalyTypes
  - `FRONTEND_SPEC.md` (50 lines) — Jason Trust Meter UI spec
  - `WILDCARD_PROMPTS.md` (147 lines) — Imagen/Veo prompts, prewarm cache, card collectibles
- **SHOT_STEPS.md v2.0:** Revised against LS_VIDEO_PIPELINE.md:
  - Removed `tunnel_darkness_01` from all tables (darkness is CSS black screen only, no media)
  - Added `flashlight_sweep_01` (10s, muted) to Scene Key, Canonical Sequencing, Media Filename, Step Machine
  - `flashlight_beam` scene key now maps to `flashlight_sweep_01` (was `tunnel_flashlight_01`)
  - Step Machine: Step 7 → `flashlight_sweep_01` (muted), new Step 8 → `tunnel_flashlight_01`
  - Still count 16 → 15, clip count corrected to 18
  - `maintenance_reveal_01` inserted in Canonical Sequencing between `park_liminal` and `park_shaft_view`
- **LS_VIDEO_PIPELINE.md:** Added descriptive line 1. Internal contradiction noted: `card_joker_01` listed as 10s in step 7 but 15s in detail section (15s is authoritative).
- **GCS:** `flashlight_sweep_01.mp4` uploaded to `gs://liminal-sin-assets/clips/`

### Bug 4 — Joker Card Scene Timing (Fixed, deployed revision 00076-njc)
- **Root cause:** `triggerCardDiscovered` fired inline with `triggerSceneChange` in step 10 and step 21 gmCalls arrays. The 120ms gap between WS sends was too short — the card overlay appeared before the scene image/clip had loaded on the frontend. Player saw the Joker card floating over the previous tunnel_generator_01 scene, and Jason narrated the card before the visual matched.
- **Fix:** Removed `triggerCardDiscovered` from both step 10 and step 21 `gmCalls` arrays in `stepMachine.ts`. Added 3-second delayed `card_discovered` WS emission in the `card1_auto_pick` and `hallway_pov_02_all` extra handlers in `server.ts`. The frontend now has 3 full seconds to load the scene before the card overlay appears.
- **Files:** `server/services/stepMachine.ts`, `server/server.ts`

### Previous Fixes (Still Live)
- **Bug 1 — Jason ignoring player speech:** `sendText()` + `injectSceneContextIntoJason()` gated to `hold_for_input` steps only. Chained_auto steps skip both.
- **Bug 2 — Glitch effect persisting forever:** React useEffect cleanup race fixed on frontend.
- **Bug 3 — Slow motion video:** `playbackRate = 1.0` defense on all 3 video play sites. 18 clips re-encoded to CRF 23 / 5Mbps cap.
- **Step machine rewrite:** Canonical Act 1 steps 8–22, correct durations, trigger types.

### Backend Systems (all live)
- All backend game logic complete and audited.
- Morphic media canonicalized: 15 stills + 18 clips on GCS bucket `liminal-sin-assets` (includes `flashlight_sweep_01.mp4`).
- Acecard mechanic live: triggerAcecardReveal, step 22 keyword gate.
- Wildcard prewarm architecture live.
- RAI safety level set to `BLOCK_ONLY_HIGH` in Veo config.

### Files Modified This Session
| File | Change |
|---|---|
| `docs/SHOT_SCRIPT.md` | v3.0 — revised against LS_VIDEO_PIPELINE, split into 5 docs, clip count 19→18 |
| `docs/SHOT_SCRIPT_PART2.md` | NEW — Phases 6–8 extracted from SHOT_SCRIPT |
| `docs/WS_EVENTS.md` | NEW — WS event registry extracted from SHOT_SCRIPT |
| `docs/FRONTEND_SPEC.md` | NEW — Trust Meter UI spec extracted from SHOT_SCRIPT |
| `docs/WILDCARD_PROMPTS.md` | NEW — Appendices extracted from SHOT_SCRIPT |
| `docs/SHOT_STEPS.md` | v2.0 — removed tunnel_darkness_01, added flashlight_sweep_01, fixed flashlight_beam mapping, added Step 8, inserted maintenance_reveal_01, still count 16→15 |
| `docs/LS_VIDEO_PIPELINE.md` | Added descriptive line 1 |
| `CURRENT_STATE.md` | Updated with doc audit changes |

---

## WS Event Contract (Backend → Frontend)

| Event | Payload key(s) | Notes |
|---|---|---|
| `scene_change` | `sceneKey`, `mediaId`, `triggerType`, `timeoutSeconds` | Step machine scene advance |
| `scene_image` | `sceneKey`, `imageData`, `mediaId`, `triggerType`, `timeoutSeconds` | Imagen 4 still (wildcard/live-generated) |
| `scene_video` | `sceneKey`, `videoUrl`, `mediaId`, `triggerType`, `timeoutSeconds`, `audioMode` | Veo 3.1 clip |
| `card_discovered` | `cardId` | First-time card reveal (3s delayed after scene_change) |
| `dread_timer_start` | `durationMs` | Starts frontend countdown |
| `game_over` | — | Dread timer expired |
| `good_ending` | — | Card2 collected in time |
| `slotsky_trigger` | `anomalyType` | CSS/env anomaly event |
| `hud_glitch` | `intensity` | GM-triggered CSS glitch |
| `agent_speech` | `audioData` (base64) | NPC audio stream |
| `trust_update` | `trustLevel` | Float 0.0–1.0 |
| `acecard_keyword_timer_start` | — | 30s keyword window begins |
| `acecard_reveal_start` | `mediaId` | Acecard clip begins |
| `card_pickup_02_ready` | `mediaId` | Card2 pickup window opens |
| `wildcard3_trigger` | — | Wildcard 3 (good ending) starts |
| `video_gen_started` | `pipelineId` | Veo generation in progress |
| `wildcard_vision_feed_start` | — | Smartglasses vision feed begins |
| `wildcard_vision_feed_end` | — | Smartglasses vision feed ends |
| `wildcard_scare_sfx` | — | Play scare SFX |
| `wildcard_game_over_loading` | — | Game over prewarm loading |
| `wildcard_game_over_start` | — | Game over sequence starts |
| `wildcard_good_ending_loading` | — | Good ending prewarm loading |
| `wildcard_good_ending_start` | — | Good ending sequence starts |

## WS Event Contract (Frontend → Backend)

| Event | Payload key(s) | Notes |
|---|---|---|
| `audio_chunk` | `data` (base64 PCM) | Player microphone stream |
| `video_frame` | `data` (base64 JPEG) | Webcam 1 FPS |
| `card_collected` | `cardId` | Player tapped card overlay |
| `intro_complete` | — | Onboarding done; starts step machine |
| `hallway_pov_02_ready` | — | Frontend rendered hallway_pov_02 still |
| `acecard_reveal_complete` | — | Acecard clip finished playing |

---

## Active Constraints

- All state in Firestore. Media in GCS. No migration without explicit approval.
- Lyria 3 audio deferred. No audio generation until `docs/AUDIO_DESIGN.md` exists.
- ADK/AutoFlow NOT implemented. Direct GenAI SDK + WebSocket only.
- **WILDCARD2** = frontend CSS/SFX treatment only — no live backend video generation for game_over branch. `maintenance_reveal_01.mp4` served from GCS.
- `docs/Contest.md` — do not archive until after March 16 5PM PDT deadline.

---

## Backend Status — 100% COMPLETE (March 15, 2026)

Zero TypeScript errors. Zero ESLint errors. Deployed at revision `liminal-sin-server-00082-wzp`.

| System | Status |
|---|---|
| WebSocket server | ✅ Live |
| Firestore session CRUD | ✅ Live |
| Jason NPC (Gemini Live) | ✅ Live — Enceladus voice |
| Audrey NPC (echo) | ✅ Live — Aoede voice, trust-gated |
| Game Master (function calls only) | ✅ Live |
| Step machine + autoplay | ✅ Live — steps 8–22, wall-clock timers, chained_auto text gating |
| Keyword detection | ✅ Live — dedicated Gemini Live session, per-step keyword lists |
| Acecard keyword gate | ✅ Live — 30s window + 15s card2 timer |
| Dread timer | ✅ Live — callback mode |
| Wildcard vision feed pipeline | ✅ Live — Imagen edit → Veo → playback |
| Wildcard game_over | ✅ Live — Morphic disk override (maintenance_reveal_01.mp4) |
| Wildcard good_ending pipeline | ✅ Live — Imagen → Veo → playback |
| Prewarm at hallway_pov_02 | ✅ Live — +90s safety retry |
| /debug/fire-gm-event | ✅ Live — gated by DEBUG_GM_ENDPOINT=true |
| /debug/test-wildcard-vision | ✅ Live — gated by DEBUG_GM_ENDPOINT=true |
| /log-client-error | ✅ Live |
| Cloud Run | ✅ revision 00082-wzp |


