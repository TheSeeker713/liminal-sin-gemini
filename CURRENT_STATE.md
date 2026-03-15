# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 14, 2026 (step machine rewrite + Bug 1/2/3 fixes).

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00072-r6h` — serving 100% traffic |
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

## Current Live State (March 14, 2026 — STEP MACHINE REWRITE + BUG FIXES)

### Step Machine Rewrite (deployed revision 00072-r6h)
- **stepMachine.ts** completely rewritten — 4 files changed across backend.
- Canonical Act 1 sequence: steps 8–22 with correct clip durations and trigger types.
- STEP_TRANSITIONS: 7→8→9→10→11(terminal), 12→13→14→15→16→17→18→19→20→21→22(terminal).
- STEP_AUTOPLAY_ACTIONS: 15 entries covering all active steps.
- 4 interactive pause points: steps 10, 16, 18, 22 are `hold_for_input`.
- Step 11 is terminal (card_collected handler owns progression).
- Step 22 is terminal (acecard gate owns progression).

### Bug Fixes (deployed revision 00072-r6h)
- **Bug 1 — Jason ignoring player speech:** Root cause was `sendText()` flooding during `chained_auto` steps. During rapid step chains (park sequence 12→15), Jason received 8+ forced text turns that drowned out player audio via `sendRealtimeInput`. Fix: autoplay narration (`sendText`) and scene context injection (`injectSceneContextIntoJason`) now only fire on `hold_for_input` steps or keyword triggers. Chained_auto steps skip both, leaving Jason free to listen.
- **Bug 2 — Glitch effect persisting forever:** Root cause was a React useEffect cleanup race. The `hud_glitch` timer cleanup function canceled the `setGlitchClass(null)` timer when `lastEvent` changed. Fix applied on frontend: removed the useEffect cleanup return + added `setGlitchClass(null)` to the scene_change handler as a safety net.
- **Bug 3 — Slow motion video:** Added defensive `playbackRate = 1.0` to all 3 video play sites (GCS clip, wildcard scene_video, acecard clip). Re-encoded all 18 clips to web-friendly bitrate (CRF 23, 5Mbps cap, 1080p) — total size reduced from 371MB to 78MB. Re-encoded clips ready in `assets/generated_clips_web/`, pending upload to GCS.

### Backend Systems (all live)
- All backend game logic complete and audited.
- Morphic media canonicalized: 16 stills + 18 clips on GCS bucket `liminal-sin-assets`.
- Acecard mechanic live: triggerAcecardReveal, step 31 keyword gate.
- Wildcard prewarm architecture live.
- RAI safety level set to `BLOCK_ONLY_HIGH` in Veo config.

### Files Modified This Session
| File | Change |
|---|---|
| `server/server.ts` | Skip `sendText` + `injectSceneContextIntoJason` during `chained_auto` steps |
| `server/services/stepMachine.ts` | Complete rewrite — steps 8–22, durations, trigger types |
| `server/services/gameMaster.ts` | `flashlight_beam`→`tunnel_darkness_01`, added `flashlight_scanning`, updated hold set |
| `server/services/keywordLibrary.ts` | Remapped keywords to steps 7, 10, 16, 18 |

### Pending Action
- **GCS upload:** Re-encoded clips in `assets/generated_clips_web/` need to be uploaded to replace the high-bitrate originals on `gs://liminal-sin-assets/clips/`.

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

---

## Backend Status — 100% COMPLETE (March 14, 2026)

Zero TypeScript errors. Zero ESLint errors. Deployed at revision `liminal-sin-server-00072-r6h`.

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
| Cloud Run | ✅ revision 00072-r6h |

---

## Frontend Status — 100% COMPLETE (March 14, 2026)

Zero TypeScript errors. Zero ESLint errors. Zero warnings.

| System | Status |
|---|---|
| Onboarding (permissions gate + PLAY flow) | ✅ Live — Single consolidated screen, auto-detects granted perms |
| Connecting screen | ✅ Live — Black screen with pulse; waits for `session_ready` |
| Credits sequence (correct 9-line script, 19s) | ✅ Live — 3 fade blocks + title card, starts only after WS open |
| `session_ready` → intro trigger | ✅ Live — `intro_complete` guaranteed over open WS |
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


