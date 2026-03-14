# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 15, 2026 (post-frontend implementation + full FE/BE audit).

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00050-r2p` — serving 100% traffic |
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

## Current Live State (March 15, 2026 — POST-FE IMPLEMENTATION + FULL AUDIT)

### Backend (unchanged since March 14)
- All backend game logic complete and audited: gmTools, dreadTimer, sessionEndings, card_collected, WS handlers.
- Morphic media canonicalized: 16 stills + 18 clips uploaded to GCS bucket `liminal-sin-assets`.
  - Stills: `https://storage.googleapis.com/liminal-sin-assets/stills/<mediaId>.png`
  - Clips: `https://storage.googleapis.com/liminal-sin-assets/clips/<mediaId>.mp4`
  - Public read access verified. No authentication required for browser fetches.
  - Upload script: `scripts/upload-gcs.ts`
- Step machine operating with per-step `mediaId`, `triggerType`, and `timeoutSeconds` payloads.
- Acecard mechanic live: `triggerAcecardReveal`, step 31 keyword gate, `startAcecardKeywordTimer`.
- Wildcard prewarm architecture live: game_over and good_ending prewarm from `hallway_pov_02` anchor.
- RAI safety level set to `BLOCK_ONLY_HIGH` in Veo config (unblocked pipeline).
- Zero dead-code issues (minor: ~50 lines unused functions in gameMaster.ts lines 96–146, safe to remove post-contest).

### Frontend (NEW — March 15, 2026)
- **FRONTEND_PLAN.txt fully implemented.** All P0, P1, and P2 items complete.
- **2 critical P0 bugs fixed:**
  - `found_transition` was prematurely ending session → now cosmetic CSS pulse only.
  - `anomaly_cards` was triggering full card overlay → now CSS VHS distortion only.
- **GCS Morphic media integration live:** Frontend loads stills/clips from GCS bucket on `scene_change` events. No longer relies solely on base64 `scene_image` payloads for Morphic scenes.
- **All WS event types synchronized** between frontend and backend — 100% contract compliance.
- **7 wildcard slotsky handlers** implemented (vision feed start/end, scare SFX, game_over loading/start, good_ending loading/start).
- **Acecard flow fully wired:** keyword timer (30s heartbeat escalation), reveal (plays clip from GCS + sends `acecard_reveal_complete`), card pickup (shows still + card2 overlay).
- **Wildcard3 trigger handler** implemented.
- **DemoEndOverlay updated:** Play Again for both endings, "to be continued" text for good_ending.
- **WS reconnect backoff** added (3 attempts: 1s, 3s, 5s).
- **Dead code removed:** `fmv_trigger`/`fmv_stop` handlers, `handleEndSession`, unused types.
- **New CSS classes:** slotsky-cards-vhs, slotsky-scan-pulse, wildcard2-loading/active, wildcard3-loading/active, wildcard-hud-active.
- TypeScript: zero errors. ESLint: zero errors, zero warnings.

---

## WS Event Contract (Backend → Frontend)

| Event | Payload key(s) | Notes |
|---|---|---|
| `scene_change` | `sceneKey`, `mediaId`, `triggerType`, `timeoutSeconds` | Step machine scene advance |
| `scene_image` | `sceneKey`, `imageData`, `mediaId`, `triggerType`, `timeoutSeconds` | Imagen 4 still (wildcard/live-generated) |
| `scene_video` | `sceneKey`, `videoUrl`, `mediaId`, `triggerType`, `timeoutSeconds`, `audioMode` | Veo 3.1 clip |
| `card_discovered` | `cardId` | First-time card reveal |
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
- Voicebox → smartglasses lore migration: `jason.ts` system prompt. Tracked as separate sprint. NOT DONE.
- GM 8-beat playbook target documented in SHOT_SCRIPT.md; updating `gemini.ts` deferred until approved.

---

## Backend Status — 100% COMPLETE (March 14, 2026)

Zero TypeScript errors. Zero ESLint errors. Deployed at revision `liminal-sin-server-00050-r2p`.

| System | Status |
|---|---|
| WebSocket server | ✅ Live |
| Firestore session CRUD | ✅ Live |
| Jason NPC (Gemini Live) | ✅ Live — Enceladus voice |
| Audrey NPC (echo) | ✅ Live — Aoede voice, trust-gated |
| Game Master (function calls only) | ✅ Live |
| Step machine + autoplay | ✅ Live — 16 steps, correct trigger types & sceneKeys |
| Acecard keyword gate | ✅ Live — 30s window + 15s card2 timer |
| Dread timer | ✅ Live — callback mode |
| Wildcard vision feed pipeline | ✅ Live — Imagen edit → Veo → playback |
| Wildcard game_over | ✅ Live — Morphic disk override (maintenance_reveal_01.mp4) |
| Wildcard good_ending pipeline | ✅ Live — Imagen → Veo → playback |
| Prewarm at hallway_pov_02 | ✅ Live — +90s safety retry |
| /debug/fire-gm-event | ✅ Live — gated by DEBUG_GM_ENDPOINT=true |
| /debug/test-wildcard-vision | ✅ Live — gated by DEBUG_GM_ENDPOINT=true |
| /log-client-error | ✅ Live |
| Cloud Run | ✅ revision 00050-r2p |

---

## Frontend Status — 100% COMPLETE (March 15, 2026)

Zero TypeScript errors. Zero ESLint errors. Zero warnings.

| System | Status |
|---|---|
| WS transport (GameWSContext) | ✅ Live — all event types, reconnect backoff |
| GCS Morphic media loading | ✅ Live — 16 stills + 18 clips from bucket |
| Scenario effects (slotsky, cards, timers) | ✅ Live — all handlers wired |
| General effects (scene loading, glitch, trust) | ✅ Live — Morphic media path + fallback |
| Acecard keyword timer | ✅ Live — 30s heartbeat escalation |
| Acecard reveal playback | ✅ Live — GCS clip + completion event |
| Card pickup overlay | ✅ Live — still + card2 overlay |
| Wildcard CSS effects | ✅ Live — 7 new CSS classes |
| Demo end overlay | ✅ Live — Play Again for both endings |
| Audio SFX manifest | ✅ Live — scare_wildcard added |
| Preload first 3 Morphic stills | ✅ Live |

---

## Files Modified — March 15, 2026 (Frontend Implementation)

| File | Change |
|---|---|
| `app/ls/game/mediaManifest.ts` | **NEW** — GCS constants, Morphic media IDs, helper functions |
| `app/ls/game/GameWSContext.tsx` | 5 new event types, expanded payloads, reconnect backoff, removed dead types |
| `app/ls/game/useGameHudScenarioEffects.ts` | Fixed 2 P0 bugs, added 7 slotsky handlers, acecard/card pickup/wildcard3 handlers |
| `app/ls/game/useGameHudGeneralEffects.ts` | GCS Morphic loading, hallway_pov_02_ready emission, preload stills, removed dead handlers |
| `app/ls/game/DemoEndOverlay.tsx` | Play Again for both endings, "to be continued" text |
| `app/ls/game/GameHUD.tsx` | Removed dead handleEndSession, replaced with handleReload |
| `app/styles/game-effects.css` | 7 new wildcard CSS classes |
| `app/ls/game/audioManifest.ts` | Added scare_wildcard SFX key |

---

## Status Delta — March 15, 2026 (Frontend Implementation + Full Audit)

- **FRONTEND_PLAN.txt fully implemented** — all P0, P1, P2 items complete.
- **2 critical P0 bugs fixed** in `useGameHudScenarioEffects.ts`:
  - `found_transition` no longer ends session prematurely.
  - `anomaly_cards` no longer triggers full card overlay.
- **CRITICAL architecture gap closed:** Frontend now loads Morphic stills/clips from GCS on `scene_change`, not just from base64 `scene_image`.
- **Full FE + BE audit completed.** Backend: 100% production-ready, zero critical bugs. Frontend: 100% event contract compliance, zero TS/ESLint errors.
- **Full audit report written** to `FE_BE_FULL_AUDIT.txt` in the frontend workspace.
