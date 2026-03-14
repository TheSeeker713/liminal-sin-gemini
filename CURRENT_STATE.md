# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **UPDATE RULE:** When updating this file, REPLACE the previous content and write a single current-state snapshot. Do NOT append. Historical logs belong in git history.
> Last updated: March 14, 2026.

---

## Deadlines

- **Hard deadline:** March 16, 2026 at 5:00 PM PDT (Google Gemini Live Agent Challenge).

---

## Infrastructure

| Item | Value |
|---|---|
| Cloud Run URL | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| Live revision | `liminal-sin-server-00045-x72` — serving 100% traffic |
| GCP Project | `project-c4c3ba57-5165-4e24-89e` (Mycelia Interactive) |
| Org | `digitalartifact11-org` (165684325504) |
| GM model | `gemini-live-2.5-flash-native-audio` (via `GM_LIVE_MODEL` env var) |
| NPC model | `gemini-live-2.5-flash-native-audio` (default in `LiveSessionManager`) |
| Imagen model | `imagen-4.0-generate-001` / `us-west1` |
| Veo model | `veo-3.1-fast-generate-001` / `us-central1` (NOT us-west1) |
| Auth | Service account (Vertex AI) — SA auth works fine; org blocks API keys |

---

## Current Live State (March 14, 2026)

- All backend game logic complete: gmTools, dreadTimer, sessionEndings, card_collected, WS handlers.
- Morphic media canonicalized: 16 stills + 18 clips under `assets/generated_stills/` and `assets/generated_clips/`.
- Step machine operating with per-step `mediaId`, `triggerType`, and `timeoutSeconds` payloads.
- Acecard mechanic live: `triggerAcecardReveal`, step 31 keyword gate, `startAcecardKeywordTimer`.
- Wildcard prewarm architecture live: game_over and good_ending prewarm from `hallway_pov_02` anchor.
- RAI safety level set to `BLOCK_ONLY_HIGH` in Veo config (unblocked pipeline).

---

## WS Event Contract (Backend → Frontend)

| Event | Payload key(s) | Notes |
|---|---|---|
| `scene_image` | `sceneKey`, `imageData`, `mediaId`, `triggerType`, `timeoutSeconds` | Imagen 4 still |
| `scene_video` | `sceneKey`, `videoUrl`, `mediaId`, `triggerType`, `timeoutSeconds` | Veo 3.1 clip |
| `card_discovered` | `cardId` | First-time card reveal |
| `dread_timer_start` | `durationMs` | Starts frontend countdown |
| `game_over` | — | Dread timer expired |
| `good_ending` | — | Card2 collected in time |
| `slotsky_trigger` | `anomalyType` | CSS/env anomaly event |
| `hud_glitch` | `intensity` | GM-triggered CSS glitch |
| `agent_speech` | `audioData` (base64) | NPC audio stream |
| `trust_update` | `trustLevel` | Float 0.0–1.0 |

## WS Event Contract (Frontend → Backend)

| Event | Payload key(s) | Notes |
|---|---|---|
| `audio_chunk` | `data` (base64 PCM) | Player microphone stream |
| `video_frame` | `data` (base64 JPEG) | Webcam 1 FPS |
| `card_collected` | `cardId` | Player tapped card overlay |
| `intro_complete` | — | Onboarding done; starts step machine |
| `hallway_pov_02_ready` | — | Frontend rendered hallway_pov_02 still |

---

## Active Constraints

- **server.ts** at ~1600 lines violates 400-line source cap. Split deferred (Plan Item 4 in NEXT_SESSION.txt) — requires user confirmation.
- **docs/Contest.md** — do not archive until after March 16 5PM PDT deadline.
- All state in Firestore. Media in GCS. No migration without explicit approval.
- Lyria 3 audio deferred. No audio generation until `docs/AUDIO_DESIGN.md` exists.
- ADK/AutoFlow NOT implemented. Direct GenAI SDK + WebSocket only.


**1 — Relax safety filters**

- Add `safetyFilterLevel: "block_only_high"` to Veo `generateVideos` config in both `veo.ts` (production) and `pipeline-variant-benchmark.ts` (test script).
- Also add `addWatermark: false` if the SDK accepts it.
- Also fix `veo.ts`: strip string `"horror"` from any prompt template; add `console.warn('[VEO] RAI filter blocked:', ...)` instead of silently returning null.

**2 — Negative prompt system**

- Create a centralized `NEGATIVES` constant (shared between imagen.ts, veo.ts, and benchmark script):
  ```
  "people, faces, person, human, body, hands, crowd, watermark, logo, text, UI, blurry, low quality, overexposed, cartoon, anime, CGI, rendered"
  ```
- Apply as `negativePrompt` param to all Imagen 4 and Veo calls.

**3 — Chained pipeline (last-frame extraction)**

- Integrate ffmpeg via `fluent-ffmpeg` or direct `child_process.spawn` to extract the last frame of a video buffer as JPEG.
- Create a helper `extractLastFrame(videoPath: string): Promise<Buffer>` in a new `scripts/frameExtract.ts`.
- Update `pipeline-variant-benchmark.ts` so that after scene[N] video succeeds, it extracts the last frame and uses it as the reference image for scene[N+1] video (not a fresh Imagen call).
- Scene[0] still uses Imagen for the initial reference. All subsequent scenes chain from the last frame.

**4 — Seed monitor + logging**

- Log the seed value returned by Imagen 4 in the benchmark output (`SceneResult` type + `benchmark.json`).
- Log the seed value returned by Veo if the API exposes it.
- This enables reproducibility and debugging of specific frames.

**5 — FPV/POV video prompts**

- Rewrite ALL 12 `VIDEO_HINTS` entries in `pipeline-variant-benchmark.ts` to include:
  `"point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement"`
- Remove any language that could imply a person/human is visible.
- The goal: viewers feel they ARE Jason, not that they are watching Jason.

---

### Completed This Session

- [x] `getVeoAiClient()` added to `server/services/gemini.ts`
- [x] `server/services/veo.ts` updated to use `getVeoAiClient`; fallback model chain (`veo-3.1-fast → veo-3.0-fast → veo-3.0`); `enhancePrompt: true`; `durationSeconds: 6`
- [x] `scripts/pipeline-variant-benchmark.ts` created — 12 scene keys, HH:MM:SS timers, saves JPEG + MP4, writes `benchmark.log` + `benchmark.json`, stops on CRITICAL/POLICY_VIOLATION
- [x] `scripts/vanilla-veo-test.ts` created — standalone text-to-video test (no input image), confirmed API connectivity
- [x] Build + lint clean

### Pending / Not Started

- [x] **Directive 1:** Safety filter relaxation (`safetyFilterLevel: "block_only_high"` in veo.ts + benchmark)
- [x] **Directive 2:** Centralized `NEGATIVES` constant in imagen.ts, veo.ts, and benchmark
- [x] **Directive 3:** `scripts/frameExtract.ts` + chained pipeline in benchmark
- [x] **Directive 4:** Seed logging in SceneResult + benchmark.json output
- [x] **Directive 5:** FPV/POV rewrite of all 12 VIDEO_HINTS in benchmark script
- [x] veo.ts: strip "horror" from prompts, add explicit RAI warning log
- [x] Full benchmark run after all above are done
- [x] Final deploy (`npm run deploy`) — deployed March 14, 2026 — revision `liminal-sin-server-00045-x72` live at `https://liminal-sin-server-1071754889104.us-west1.run.app`

---

### Status Delta — March 14, 2026

- All 6 IMPLEMENTATION_PLAN sections (A–F) fully implemented and deployed.
- `IMPLEMENTATION_PLAN.txt` deleted after implementation confirmed.
- **Section A** — Acecard reveal mechanic: `startAcecardKeywordTimer`, `handleAcecardReveal`, `startCardPickup02Timer` added to `server.ts`; `triggerAcecardReveal` tool added to `gmTools.ts`; `onAcecardReveal` callback wired through `gameMaster.ts`.
- **Section B** — Step machine: steps 24/26/28/31 added to `STEP_MEDIA_TRIGGER`; autoplay chain extended to 7→9→11→13→17→19→21→23→24→25→26→27→28→29→31 (step ≥31 terminal).
- **Section C** — Timer corrections: steps 13 and 25 corrected from 22s→30s in `STEP_MEDIA_TRIGGER`.
- **Section D/E** — `gmTools.ts`: `triggerSceneChange` sceneKey description replaced with exact registry key list (5 new keys added: `park_liminal, elevator_inside, elevator_inside_2, hallway_pov_02, acecard_reveal`); `triggerDreadTimerStart` corrected to 30s/acecard keyword window/step 31 only; `triggerAcecardReveal` Option A broad semantic match made explicit.
- **Section F** — `docs/SHOT_SCRIPT.md` doc fixes F1–F7 applied; Appendix E step registry replaced; WS Event Registry updated with 4 acecard events.
- **Phase narrative docs (A2)** — SHOT_SCRIPT.md Phase 6B rewritten (park_liminal chained_auto); Phase 6C added (park_shaft_view decision beat); Phase 7 rewritten (elevator descent + maintenance corridor, steps 26/27/28/29); Phase 7B added (acecard keyword gate, both outcome paths).
- **Media Filename Registry** — 8 stale timeout/trigger values corrected (card_joker_01: 22→30; park_liminal_01: hold_for_input/22→chained_auto/30; shaft_maintenance_01: 22→30; elevator_inside_01/02: 15→30; hallway_pov_02: 15→30; acecard_reveal_01: 22→conditional/—; card_pickup_02: 25→15).
- TypeScript type-check and ESLint: zero errors on all modified files.
- Cloud Run revision `liminal-sin-server-00045-x72` deployed and serving 100% of traffic.

---
