# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 16, 2026 (Frontend: D1 comments page, player subtitles, timed unlock, access cutoff, game page shell).

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00091-d7g` — serving 100% traffic |
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

## Current Live State (March 16, 2026 — FRONTEND FEATURES + D1 COMMENTS)

### Frontend Deploys (Cloudflare Pages — commits 8324a8f, 063b35a)
- **D1-backed anonymous comments page** (`/ls/comments`): Worker API routes (`GET /api/comments`, `POST /api/comments`) in `workers/signup-api.ts`. Self-initializing `ls_comments` table in D1. Comments page at `app/ls/comments/page.tsx`. Footer link added in `LiminalSinAccessFooter.tsx`.
- **Player speech subtitles**: `usePlayerSubtitles.ts` (Web Speech API hook) + `PlayerSubtitles.tsx` (cinematic subtitle bar). Wired into `GameHUD.tsx`.
- **Timed LOCKED→PLAY button**: `LiminalSinHero.tsx` — unlocks March 17 01:13 UTC.
- **`/ls/game` access cutoff**: `page.tsx` — expires March 23 17:11 UTC. Judges route unaffected.
- **Game page header/footer**: `GamePageShell.tsx` — auto-hiding header, fixed footer, z-[60].
- **Removed Request Access section** from `LiminalSinAccessFooter.tsx`.
- **Cloudflare Worker Version**: `c65c6d2f-60c3-44b5-b60e-d9b637b81f88`

### Backend Deploy (Cloud Run — revision 00091-d7g, commit 453ad2a)
- **maintenance_reveal_01 timeout**: Fixed to 15s (was 16s).
- **card_joker_01 timing**: Removed card spoilers from autoplayText/sceneContext, added 8s cue, delayed card_discovered to 16s.

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

### Files Modified This Session (Frontend — Cloudflare)
| File | Change |
|---|---|
| `workers/signup-api.ts` | Added D1 comments CRUD routes (handleGetComments, handlePostComment, ensureCommentsTable) |
| `app/ls/comments/page.tsx` | NEW — D1-backed anonymous comments page |
| `app/ls/LiminalSinAccessFooter.tsx` | Removed Request Access section; added Comments footer link |
| `app/ls/game/usePlayerSubtitles.ts` | NEW — Web Speech API hook with inline type declarations |
| `app/ls/game/PlayerSubtitles.tsx` | NEW — Cinematic subtitle overlay component |
| `app/ls/game/GameHUD.tsx` | Added PlayerSubtitles import + render |
| `app/ls/LiminalSinHero.tsx` | Timed LOCKED→PLAY button (March 17 01:13 UTC unlock) |
| `app/ls/game/page.tsx` | Access cutoff guard (March 23 17:11 UTC), GamePageShell wrapper |
| `app/ls/game/GamePageShell.tsx` | NEW — Auto-hiding header + fixed footer for game pages |
| `app/ls/judges/game/page.tsx` | Added GamePageShell wrapper |

### Files Modified This Session (Backend — Cloud Run)
| File | Change |
|---|---|
| `server/services/stepMachine.ts` | maintenance_reveal_01 timeout=15s; step 10 autoplayText card ref removed |
| `server/services/clipCues.ts` | card_joker_01 cues at 5000ms, 8000ms, 13000ms |
| `server/server.ts` | card_discovered delay = 16_000ms |
| `server/services/keywordLibrary.ts` | generator_card_reveal context → generator description |

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


