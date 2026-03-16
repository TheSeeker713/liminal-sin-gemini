# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 16, 2026 (6-bug hotfix: Jason hallucination, subtitle lag, SFX volume, joker timing, NPC delay, elevator crash).

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00094-mdl` — serving 100% traffic |
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

## Current Live State (March 16, 2026 — 6-BUG HOTFIX)

### Backend Deploy (Cloud Run — revision 00094-mdl, commit 51dbae3)
- **Bug 1 — Jason hallucinating old prompts:** Removed "Queen of spades" example from NPC system prompt; fixed SEPARATION section contradiction.
- **Bug 4 — Joker card speech timing:** Step 10 autoplayText no longer says "lights come on"; generator_card_reveal scene context rewritten to "wait and observe"; GM Beat 4 no longer calls triggerCardDiscovered (step machine owns card timing exclusively).
- **Bug 5 — NPC unresponsive 15s after title:** jasonReadyTimer corrected from 18,000ms to 10,000ms.
- **Bug 7 — Elevator scene crash:** Added try/catch to sendAudio/sendText/sendFrame/sendToolResponse in LiveSessionManager (dead Gemini session no longer crashes WS handler); thinned elevator clip cues (removed 0ms-offset sendText calls, consolidated to ≥1500ms spacing).

### Frontend Deploy (Cloudflare — version 9b139b4a, commit 94d5426)
- **Bug 2 — Subtitle lag:** Web Speech API restart delay reduced 300ms→50ms; fade timer extended 2000→3000ms.
- **Bug 3 — Radio static SFX too loud:** transmission_ping volume 0.4→0.18; barge_in volume 1.0→0.25.

### Files Modified — Backend (Cloud Run)
| File | Change |
|---|---|
| `server/services/npc/jason.ts` | Removed card example, fixed SEPARATION contradiction |
| `server/services/stepMachine.ts` | Step 10 autoplayText → "decide to try starting the generator" |
| `server/services/keywordLibrary.ts` | generator_card_reveal context rewritten (no premature light description) |
| `server/services/gemini.ts` | GM Beat 4 card race removed; try/catch on all LiveSession send methods |
| `server/server.ts` | jasonReadyTimer 18000→10000ms |
| `server/services/clipCues.ts` | Thinned elevator cues (0ms→1500ms+, consolidated) |

### Files Modified — Frontend (Cloudflare)
| File | Change |
|---|---|
| `app/ls/game/usePlayerSubtitles.ts` | Restart delay 300→50ms, fade timer 2000→3000ms |
| `app/ls/game/useAgentAudio.ts` | transmission_ping 0.4→0.18, barge_in 1.0→0.25 |

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


