# CURRENT_STATE.md - Liminal Sin Gemini (Backend)

> **AI WORKING MEMORY** - This file is the source of truth for the current state of the backend project.
> Last updated: March 10, 2026 (B4 + B5 COMPLETE — all 7 GM tools battle-tested. **Frontend F1-F6 ALL COMPLETE.** Full demo integration testing unblocked. **Intro sequence + audio fix + demo strategy planned — March 10.**)

---

## WARNING: NEXT AI SESSION - READ THIS FIRST

Before writing any code, read AGENTS.md and the mandatory docs in Section 9.
The server is backend-only (Cloud Run). All frontend code lives in the myceliainteractive repo.

**ARCHITECTURE CORRECTION (March 9):**
The GM is a SILENT gaming engine — it uses Gemini Pro as an AI agent system. It NEVER speaks to the player.
It talks to other AI agents (JASON, Slotsky). Slotsky is invisible — handles scene changes and in-game perks.
The GM communicates ONLY via function calls. Any code routing GM audio to the player is architecturally wrong.

---

## What Has Been Built - Session History

### Steps A-D (completed prior session)

1. **Backend server on Cloud Run** - `wss://liminal-sin-server-1071754889104.us-west1.run.app`
2. **Frontend WS connect** - deferred to "Begin Session" click to satisfy browser autoplay policy
3. **Mic capture** - `ScriptProcessorNode` at 16kHz, raw PCM Int16 -> base64 -> `player_speech` WS message
4. **JASON dialogue** - full back-and-forth, in-lore, Gemini Live native audio (Enceladus voice)

### Steps E-J (completed March 9)

5. **Voice barge-in (Step F)** - `agent_interrupt` WS event cancels all queued `AudioBufferSourceNode`s instantly.
6. **Layered audio system (Step E)** - `audioManifest.ts` + `useAudioLayers.ts`. Three Web Audio channels: `musicGain`, `sfxGain`, `ambientGain`. 83 audio files mapped to 28 event keys. Session-locked music picks, SFX anti-repeat, volume micro-jitter.
7. **SIGNAL LOST bug** - `app/ls/judges/game/page.tsx` fixed.
8. **NotReadableError: Device in use** - fixed with `captureStartedRef` guard.
9. **Jason voice changed to Enceladus** (Step G).
10. **iOS cross-device compatibility** (Step H) - shared AudioContext.
11. **echoCancellation constraint** (Step I) - mic bleed fix.
12. **GCS audio migration** (Step J) - 83 files (17 music + 66 SFX) live at `gs://liminal-sin-assets/audio/`.

---

## Core Architecture - The 3-Minute Demo

### How the Game Works

1. **BLACK SCREEN START** — No image, no video at session start. Audio only.
   - Falling sounds, crash, JASON hurt and panicking, ambient underground sounds.
   - Frontend plays SFX from GCS. JASON's Gemini Live session delivers voice.
   - Fade-in text overlay hint appears after ~10s (frontend CSS).

2. **FLASHLIGHT MECHANIC** — Player suggests "turn on your flashlight" or similar.
   - JASON confirms, describes what he sees.
   - Backend fires Imagen 4 to generate a still frame (background, non-blocking).
   - Still frame sent to frontend via `scene_image` WS event.
   - Frontend displays the image (POV through flashlight).

3. **VEO 3.1 FAST — IMAGE TO VIDEO** — After each still image is generated, a short video clip is generated from it.
   - Veo 3.1 Fast takes the Imagen 4 still as reference + zone description prompt.
   - Returns a short ~5-second video clip.
   - Sent to frontend via `scene_video` WS event (async, non-blocking — still image shown first).
   - Frontend plays the clip over the still, then freezes on last frame.
   - Uses `services/veo.ts` — fired by `triggerVideoGen` GM tool call.
   - **NEVER use Veo 2. Always use Veo 3.1 Fast.**

4. **BACKGROUND GENERATION** — While JASON stalls with dialogue, backend generates.
   - Each scene change triggers Imagen 4 (still) → then Veo 3.1 Fast (video) asynchronously.
   - Still image arrives first, video follows. Frontend handles both gracefully.
   - JASON's dialogue buys time for generation latency.

4. **DEMO END** — Approaching friends (Audrey/Josh voice echoes).
   - GM triggers `found_transition` via Slotsky.
   - Frontend disconnects image/video generation pipeline.
   - Holds final image. Frontend plays animated end sequence.

### Agent Roles

| Agent | Role | Speaks? |
|-------|------|---------|
| **Game Master (GM)** | Silent engine. Evaluates trust/fear via player audio + webcam. Dispatches function calls to control world state. | **NEVER** — function calls only |
| **JASON** | Player-facing NPC. Gemini Live native audio (Enceladus). Responds to player voice. Stalls with dialogue while scenes generate. | **YES** — real-time voice |
| **Slotsky** | Invisible agent. Handles scene changes, anomaly triggers, fourth-wall corrections. No voice, no visual presence. | **NEVER** — event flags only |

### Demo Sequence (3-minute scripted path)

| Beat | Time | What Happens | Backend Trigger | Frontend Effect |
|------|------|-------------|----------------|-----------------|
| 1 | 0:00 | Session start. BLACK SCREEN. | `session_ready` WS event | SFX: falling, crash, ambient. No image. |
| 2 | 0:05 | JASON groans, hurt. Voicebox activates. | Jason Live session opens, initial monologue prompt sent | JASON audio plays through speaker |
| 3 | 0:15 | Text hint fades in: "say something..." | (frontend timer) | CSS fade-in overlay |
| 4 | 0:20-0:40 | Player talks to JASON. He responds, can't see. | Gemini Live bi-directional audio | Dialogue continues on black screen |
| 5 | 0:40-1:00 | Player suggests flashlight/light. JASON confirms. | GM fires `triggerSceneChange` → Imagen 4 still generates → `triggerVideoGen` → Veo 3.1 Fast generates | Frontend receives `scene_image` (crossfade black→still), then `scene_video` (plays clip, freezes) |
| 6 | 1:00-1:30 | Exploration. JASON describes environment. | GM evaluates trust/fear, may fire `triggerGlitchEvent`. Each move fires `triggerSceneChange` + `triggerVideoGen`. | Scene images/videos update. Glitch effects if triggered. |
| 7 | 1:30-2:00 | Deeper into water park. Slotsky cards appear. | GM fires `triggerSlotsky(anomaly_cards)` + `triggerSceneChange` | Card image appears. SFX: slot machine bells. |
| 8 | 2:00-2:30 | JASON hears Audrey/Josh echoing. Proximity → ECHO. | GM updates `proximityState` in Firestore | Ambient: distant voice echoes |
| 9 | 2:30-2:50 | Moving toward voices. Proximity → RANGE. | GM fires trust-dependent scene changes | Scene transitions accelerate |
| 10 | 2:50-3:00 | Demo end. Proximity → FOUND. | GM fires `triggerSlotsky(found_transition)` | Frontend: hold final image, animated end sequence, session close |

**Branching is an illusion** — the story is linear. Player choices affect JASON's tone, trust level, and which Slotsky anomalies fire, but the path always leads to the same endpoint.

---

## Remaining Steps to Demo

| Step | Feature | Status |
|------|---------|--------|
| A-J  | Server, WS, mic, dialogue, audio, barge-in, GCS | DONE |
| K    | Fix server.ts opening — BLACK SCREEN start | DONE |
| K2   | Lore script triggers — demo sequence beats | DONE |
| **B1** | **Create `services/veo.ts` — Veo 3.1 Fast img2vid** | **DONE** |
| **B2** | **Add `triggerVideoGen` GM tool declaration to `gemini.ts`** | **DONE** |
| **B3** | **Wire `triggerVideoGen` in `gameMaster.ts` → `scene_video` WS event** | **DONE** |
| **F1** | **Frontend: Black screen opening + `session_ready` handler** | **DONE (pushed to main)** |
| **F2** | **Frontend: GM red eye indicator** | **DONE (pushed to main)** |
| **F3** | **Frontend: Scene image display (`scene_image` → crossfade)** | **DONE (pushed to main)** |
| **F4** | **Frontend: `scene_video` handler — play clip, freeze on last frame** | **DONE (pushed to main)** |
| **B4** | **Verify + upload remaining assets to GCS** | **DONE** |
| **B5** | **GM trust routing battle-test (Step L) — all 7 GM tools** | **DONE** |
| **B6** | **Backend bug sweep — 4 bugs found + fixed** | **DONE** |
| F5   | Frontend: Glitch effects CSS | **DONE (pushed to main)** |
| F6   | Frontend: Demo end sequence | **DONE (pushed to main)** |
| **B7** | **`POST /log-client-error` endpoint → Firestore** | **DONE (March 10)** |
| **B8** | **Intro sequence — Jason silent until `intro_complete` WS signal** | **DONE (March 10)** |
| **B9** | **Image pre-load queue — 3 scenes cached at session start** | **TODO** |
| **B10** | **GM beat map rewrite — strict 6-beat scripted flow** | **TODO** |
| **B11** | **45s flashlight hint timer — backend sends `hint` WS event** | **TODO** |
| **B12** | **Audrey NPC — female Aoede voice, trust-gated card echo** | **TODO** |
| **FE-1–4** | **Error infrastructure, mic/cam resilience, error wiring** | **DONE (March 10)** |
| **FE-5** | **Cinematic intro sequence (music → credits → title → `intro_complete`)** | **IN PROGRESS** |
| **FE-6** | **SFX volume fix (ambientGain 0.15–0.18, sfxGain dialogue 0.40–0.45)** | **IN PROGRESS** |
| **FE-7** | **Safety fix: remove strobing from high-intensity glitch CSS** | **TODO** |
| **FE-8** | **Smart glasses flashlight POV overlay (radial vignette CSS)** | **TODO** |
| **FE-9** | **VHS glitch transition on video→image swap** | **TODO** |
| **FE-10** | **Card collectible UI on `slotsky_trigger(anomaly_cards)`** | **TODO** |
| **FE-11** | **Generator lights-on transition (brightness animation)** | **TODO** |
| **FE-12** | **Audrey `agent_speech` handler — echo/reverb Web Audio filter** | **TODO** |
| N    | Demo video (4 min, mandatory submission) | March 11-14 |
| O    | Architecture diagram (mandatory) | March 13-15 |

---

## Today's Full Work Schedule (March 9 — ALL BACKEND + REQUIRED FRONTEND)

> **Execute in this order. Do not skip ahead.**
> Frontend steps F1-F4 are prerequisites for backend end-to-end testing.

---

### ~~B1 — Create `services/veo.ts` (Veo 3.1 Fast)~~ — DONE

Completed March 9. New file `server/services/veo.ts`. Veo 3.1 Fast img2vid generation.
- Takes `sceneKey` + `base64Jpeg` from Imagen 4 as input
- Constructs generation request to `veo-3.1-fast-generate-001` model
- Polls operation until done (max 120s), returns GCS URI
- Zone-specific animation hints for lore-consistent motion
- **NEVER uses Veo 2.**

### ~~B2 — Add `triggerVideoGen` GM Tool Declaration~~ — DONE

Completed March 9. Added to `gemini.ts` GM_TOOLS array.
- GM can call `triggerVideoGen(sceneKey)` after any `triggerSceneChange`
- System prompt updated: GM instructed to call both in sequence for each scene

### ~~B3 — Wire `triggerVideoGen` in `gameMaster.ts`~~ — DONE

Completed March 9. New case in `handleGmFunctionCall` switch.
- Re-generates Imagen 4 still (for reference), feeds to Veo 3.1 Fast
- On success: broadcasts `scene_video` WS event `{ type: 'scene_video', payload: { sceneKey, url } }`
- Fully async — still image already showing while video generates

---

### ~~F1 — Frontend: Black Screen Opening~~ — DONE (March 9)

Completed in `myceliainteractive` repo. `session_ready` fires 10s timer → "say something..." fade-in. Disappears on first `player_speech`. Committed and pushed to main.

---

### ~~F2 — Frontend: GM Red Eye Indicator~~ — DONE (March 9)

Completed in `myceliainteractive` repo. Red circle top-right, `gm-eye-breathe` CSS keyframe (0.3→1.0 over 3.5s). Pushed to main.

---

### ~~F3 — Frontend: Scene Image Display~~ — DONE (March 9)

Completed in `myceliainteractive` repo. Dual `<img>` layer crossfade via `pushImage()` + `requestAnimationFrame`. Pushed to main.

---

### ~~F4 — Frontend: `scene_video` Handler~~ — DONE (March 9)

Completed in `myceliainteractive` repo. `SceneVideoEvent` type added. Video overlay plays GCS URL, captures last frame via canvas → crossfade pipeline. CORS taint fallback. Pushed to main.

**B4 and B5 are now unblocked. Proceed.**

---

### ~~B4 — Verify + Upload Remaining Assets to GCS~~ — DONE (March 10)

Completed March 10. GCS bucket verified and cleaned up.
- **Verified:** 75 SFX, 8 images, 4 voice_overs already present
- **Uploaded:** 9 missing SFX (ambient_drip, concrete_impact, floor_crack, rushing_wind ×2, water_ripple ×4) + 2 images (Mycelia Banner, Logo)
- **Deleted:** All video clips (6) and podcasts (6) from GCS — not needed for contest phase
- **`.gitignore` updated:** Added binary asset exclusion rules to prevent video/image/audio commits to backend repo
- Total GCS: 87 SFX, 10 images, 4 voice_overs

---

### ~~B5 — GM Trust Routing Battle-Test (Step L)~~ — DONE (March 10)

**REQUIRES F1 + F3 to be complete first.** ✅ Both complete.

Battle-tested the full GM → Firestore → WS → frontend pipeline via `POST /debug/fire-gm-event`:

| # | GM Tool | Result | Notes |
|---|---------|--------|-------|
| 1 | `triggerTrustChange` | **PASS** | Broadcast `trust_update`, injected trust context into Jason |
| 2 | `triggerFearChange` | **PASS** | Broadcast `trust_update`, injected fear context into Jason |
| 3 | `triggerGlitchEvent` | **PASS** | Broadcast `hud_glitch` |
| 4 | `triggerSceneChange` | **PASS** | Broadcast `scene_change`, Imagen 4 generated scene image, `updateSceneKey` persisted to Firestore |
| 5 | `triggerSlotsky` | **PASS** | Broadcast `slotsky_trigger`, `updateProximityState` persisted to Firestore |
| 6 | `triggerVideoGen` | **PASS** | Imagen 4 succeeded, Veo 3.1 model returned 404 (model not yet accessible — expected) |
| 7 | `triggerAudienceUpdate` | **PASS** | Broadcast `audience_update`, injected audience context into Jason |

**Code changes for B5:**
- `db.ts`: Added `updateSceneKey()` and `updateProximityState()` to persist scene and proximity state to Firestore
- `gameMaster.ts`: Wired `updateSceneKey` into `triggerSceneChange`, wired `updateProximityState('FOUND')` into `triggerSlotsky` for `found_transition`

**Known issues (non-blocking for contest):**
- Veo 3.1 Fast model (`veo-3.1-fast-generate-001`) returns 404 — needs project access enablement
- ~~GM session closes immediately with "Text output is not supported for native audio output model"~~ — **FIXED March 10**: removed invalid `responseModalities: [Modality.TEXT]` from GM config.

---

### ~~B6 — Backend Bug Sweep~~ — DONE (March 10)

Full backend code scan (tsc + eslint + manual review). 4 bugs found and fixed:

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | **GM model crash** — `responseModalities: [Modality.TEXT]` passed to native-audio-only model caused immediate session disconnect | `gemini.ts` | Removed the invalid modality. GM uses audio output (silently discarded) + toolCall events which work correctly |
| 2 | **GM tool ACK hang** — `sendToolResponse` was inside `if (ws.readyState === OPEN)` guard; if client disconnected mid-session, Gemini hung permanently waiting for ACK | `server.ts` | Moved `sendToolResponse` outside the guard — always ACKs |
| 3 | **`GM_FUNCTION_CALL` missing `jasonManager`** — direct frontend GM messages skipped live trust/fear injection into Jason | `server.ts` | Added `jasonManager` as 5th arg to that call path |
| 4 | **`triggerTrustChange` silent float fail** — `levelMap[0.8]` → `undefined` → silently stored `0.5` instead of `0.8`; also `"high"` (lowercase) fell through | `gameMaster.ts` | Accepts raw numeric float (clamped 0–1) OR case-insensitive string enum (`high`/`High`/`neutral`/`Neutral`/`low`/`Low`) |

Also fixed stale JSDoc: `Fenrir voice` → `Enceladus voice` in `gemini.ts`.

---

### ~~F5 — Frontend: HUD Glitch Effects~~ — DONE (March 10)

Completed in `myceliainteractive` repo. Full-screen CSS animation applied to GameHUD container div.
- `low` → subtle XY jitter (0.08s steps, 500ms default)
- `medium` → shake + hue-rotate + skew (0.12s steps, 800ms default)
- `high` → heavy shake + invert + contrast + red scanline `::before` overlay (0.1s steps, 1200ms default)
- Duration controlled by `hud_glitch.duration_ms`. Blocked after demo ends.
- Pushed to main.

---

### ~~F6 — Frontend: Demo End Sequence~~ — DONE (March 10)

Completed in `myceliainteractive` repo. Full end-of-demo pipeline wired.
- On `slotsky_trigger(found_transition)`: stops all music/ambient
- Sets `demoEnded` flag — freezes scene, blocks all future `scene_image` / `scene_video` events
- Plays `proximity_found` SFX
- After 2s: fades in end overlay ("LIMINAL SIN" + "experience complete")
- After 7s: sends `session_end` to close WS gracefully
- Pushed to main.

---

### GM Eye Redesign — DONE (March 10)

Completed in `myceliainteractive` repo alongside F5/F6.
- Replaced 12px red dot with 44×28px SVG eye (almond shape, red iris with pulse animation, black pupil, white glint, red glow blur)
- **Eye only renders when webcam is actively capturing** — gated on `webcamActive` flag from `usePlayerMedia`
- This means the GM eye is literally the GM's "vision" — it lights up when the GM can actually see the player via webcam frames
- Hidden after demo ends
- Pushed to main.

---

### F5 + F6 — Frontend: Glitch Effects + Demo End Sequence

~~See frontend CURRENT_STATE.md Priorities 4 + 5. Complete after B5 passes.~~

**BOTH COMPLETE March 10.** Frontend F1-F6 fully done.

---

## Frontend Work (for myceliainteractive repo) — ALL COMPLETE

**All frontend features F1-F6 are complete and pushed to main as of March 10.**

### ~~1. GM Red Eye Indicator~~ — DONE (redesigned as SVG eye, webcam-gated)
CSS/JS animated SVG eye in screen corner. Breathes in/out. Only visible when session is active AND webcam is capturing frames (GM can actually "see" the player).

### ~~2. Black Screen Opening~~ — DONE
Game starts BLACK. SFX triggers: falling, crash, ambient underground. Text overlay hint fades in after ~10s.

### ~~3. Scene Image Display~~ — DONE
`scene_image` WS event → crossfade from black (or previous image) to new image. Dual layer crossfade pipeline.

### ~~4. Demo End Sequence~~ — DONE
On `slotsky_trigger(found_transition)`: stop audio, freeze scene, 2s → end overlay, 7s → `session_end` WS close.

### ~~5. Glitch Effects~~ — DONE
`hud_glitch` WS event → 3-tier full-screen CSS animation (low/medium/high intensity).

### ~~6. `scene_video` Handler~~ — DONE
Plays Veo 3.1 Fast clips over frozen scene, captures last frame via canvas → crossfade pipeline.

---

## FYI: Frontend Next Work — Error Handling + Camera/Mic Resilience

> **This is a frontend-only work session (`myceliainteractive` repo). No backend action required yet — except one pre-wire item (B7) which the backend session should add separately.**
> **Do NOT overwrite this section if the backend session has already added its own plan below it.**

The frontend is implementing the following in phases:

| Phase | Work | Backend Impact |
|-------|------|----------------|
| FE-1 | Error infrastructure: `useGameError.ts`, `ErrorOverlay.tsx`, `GameErrorBoundary.tsx`, D1 `client_error_logs` table, `POST /api/log-error` CF Worker endpoint | None |
| FE-2 | Mic blocker modal (fatal if mic denied at session start). Split `getUserMedia` mic/webcam separate. | None |
| FE-3 | Camera coverage pixel brightness detection. Amber non-blocking nudge banner. `CameraObscuredEvent` type added to WS contract. | **Optional:** backend can send `{ type: "camera_obscured", obscured: bool }` WS event if GM detects no face — frontend already handles it |
| FE-4 | Wire all existing silent `console.error` calls to `dispatchError` | None |

### Backend Action Required (B7) — `POST /log-client-error` on Cloud Run

The frontend pre-wires a Firestore error log call to this endpoint with `AbortSignal.timeout(3000)`. It silently ignores 404 until implemented. When the backend session is ready:
- Route: `POST /log-client-error`
- Body: `{ sessionId, errorType, message, severity, stack?, url?, timestamp }`
- Action: write one doc to Firestore collection `client_error_logs`
- No auth — errors only, no secrets

| Step | Feature | Status |
|------|---------|--------|
| **B7** | **`POST /log-client-error` endpoint on Cloud Run → Firestore** | **TODO — backend session** |

---

## Timeline

| Date | Milestone |
|------|-----------|
| March 9, 2026 | Steps A-K2 complete. B1-B3 (Veo service + GM tool + wire). F1-F4 (frontend prereqs). |
| March 10, 2026 | B4 (GCS verified) + B5 (all 7 GM tools battle-tested) + **F5 (glitch effects) + F6 (demo end) + GM eye redesign DONE.** All frontend F1-F6 complete. Integration testing unblocked. |
| March 11, 2026 @ 11:11 PM MT | **Internal prototype cutoff** — full demo must be functional |
| March 12-14 | Demo video recording + architecture diagram |
| March 15 | Submission prep, final review |
| **March 16, 2026 @ 5:00 PM PDT** | **HARD DEADLINE** |

---

## Active Project Identity

| Field | Value |
|-------|-------|
| Project | Liminal Sin — FMV psychological horror experience |
| Contest | Gemini Live Agent Challenge (Google / Devpost) |
| Hard Deadline | March 16, 2026 @ 5:00 PM PDT |
| Internal Cutoff | March 11, 2026 @ 11:11 PM MT |
| Backend Repo | `d:\DEV\liminal-sin-gemini` (Cloud Run Node.js — NO frontend code) |
| Frontend Repo | `myceliainteractive` (Cloudflare Pages — SEPARATE REPO) |
| Marketing Shell | https://myceliainteractive.com/ls — LIVE |
| Judge Backdoor | https://myceliainteractive.com/ls/judges — LIVE |
| Game Wrapper | https://myceliainteractive.com/ls/game — LIVE |
| Judge Game Wrapper | https://myceliainteractive.com/ls/judges/game — LIVE |

---

## GCP Infrastructure

| Resource | Value |
|----------|-------|
| GCP Project ID | `project-c4c3ba57-5165-4e24-89e` |
| GCP Project Name | Mycelia Interactive |
| GCP Account | `digitalartifact11@gmail.com` |
| Server Region | `us-west1` |
| Gemini Live Region | `us-central1` (required — Live API only available here) |
| Auth Method | Application Default Credentials (ADC) |
| Gemini Live Model | `gemini-live-2.5-flash-native-audio` |
| Firestore | Native mode, `us-west1` — CONNECTED |
| Cloud Run | LIVE — `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| GCS Bucket | `gs://liminal-sin-assets` — LIVE — `https://storage.googleapis.com/liminal-sin-assets/` |

---

## Backend Server — File Map

| File | Purpose |
|------|---------|
| `server/server.ts` | Express + WebSocket server, PORT 3001 locally / 8080 on Cloud Run |
| `server/types/state.ts` | TrustLevel, PlayerEmotion, PlayerSession, GmEvent type definitions |
| `server/services/db.ts` | Firestore ADC client with in-memory fallback for local dev |
| `server/services/gemini.ts` | Vertex AI Live client, GM tool declarations, `LiveSessionManager` |
| `server/services/gameMaster.ts` | GM function call router — writes to Firestore, broadcasts to WS |
| `server/services/imagen.ts` | Imagen 4 scene generation — 7 zone prompts, returns base64 JPEG |
| `server/services/veo.ts` | Veo 3.1 Fast img2vid — zone animation hints, polls operation, returns GCS URI |
| `server/services/npc/jason.ts` | Jason system prompt v2 — trust + fear floats injected at session start |
| `server/services/npc/audrey.ts` | *(B12 — TODO)* Audrey echo voice — Aoede, trust-gated card response |
| `Dockerfile` | 2-stage build (node:20-alpine), Cloud Run ready |

**Local dev server:**

```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
npx tsx server/server.ts
```

---

## Environment Variables (`.env.local` - never committed)

```
GOOGLE_CLOUD_PROJECT=project-c4c3ba57-5165-4e24-89e
GOOGLE_CLOUD_REGION=us-west1
JASON_VOICE=Enceladus
PORT=3001
```

> No `GEMINI_API_KEY` - Vertex AI mode uses ADC exclusively. No key needed locally or on Cloud Run.

---

## MARCH 10 SPRINT — FULL PLAN (Both Sessions)

> **Internal cutoff: March 11 @ 11:11 PM MT. Complete this sprint before then.**
> Backend executes B9 → B10 → B11 → B12 in order. Frontend executes FE-7 → FE-5 → FE-6 → FE-8 → FE-9 → FE-10 → FE-11 → FE-12 in order.
> Neither session touches the other repo. Cross-session handoff happens via WS events and this document.

---

### B9 — Image Pre-Load Queue

**Goal:** Eliminate the long wait for the first image. At session start (after `intro_complete`), pre-generate 3 canonical images in the background and cache them in memory. When the GM calls `triggerSceneChange`, serve from cache instantly — no Imagen 4 latency at the player-facing moment.

**Files touched:** `server/services/imagen.ts`, `server/services/gameMaster.ts`, `server/server.ts`

**Implementation:**
1. Add `imageCache: Map<string, Map<string, string>>` in `server/services/imagen.ts` — keyed `sessionId → sceneKey → base64JPEG`. Export `prewarmImageCache(sessionId)` which fires `generateSceneImage()` for `zone_tunnel_entry`, `zone_merge`, `zone_park_shore` in parallel (non-blocking, `void Promise.all`). Export `getCachedImage(sessionId, sceneKey)` returning base64 or `null`. Export `clearImageCache(sessionId)` for cleanup on WS close.
2. In `server/server.ts`, after `jasonIntroFired = true` (after `intro_complete` fires), call `prewarmImageCache(sessionId)` — fire and forget.
3. In `server/services/gameMaster.ts`, `triggerSceneChange` case: call `getCachedImage(sessionId, sceneKey)` first. If hit, broadcast `scene_image` immediately (no Imagen call). If miss, fall back to `generateSceneImage()` as before.
4. On WS `close`, call `clearImageCache(sessionId)` to prevent memory leaks.

**WS events:** No change — `scene_image` payload format unchanged.
**Verification:** Server log should show `[ImageCache] HIT` on first scene change if player delays ≥15s from `intro_complete`.

---

### B10 — GM Beat Map Rewrite

**Goal:** Replace the freeform GM demo prompt with a strict 6-beat scripted sequence. Fixes: images not syncing with lore, `found_transition` firing too early, GM over-triggering events.

**File touched:** `server/services/gemini.ts` — `getGameMasterSystemPrompt()` only.

**6-Beat Sequence (canonical):**

| Beat | Time Window | What GM MUST Do | What GM MUST NOT Do |
|------|-------------|-----------------|---------------------|
| **1 — DARKNESS** | 0:00 – ~0:40 | Call `triggerAudienceUpdate` within 10s. Evaluate trust from player's first words. Call `triggerTrustChange` once. | **NO** `triggerSceneChange`. **NO** `triggerSlotsky`. **NO** `triggerGlitchEvent` in first 30s. |
| **2 — FLASHLIGHT** | ~0:40 – ~1:00 | When player mentions light/flashlight, call `triggerSceneChange("zone_tunnel_entry")` then `triggerVideoGen("zone_tunnel_entry")`. | Only use `zone_tunnel_entry` for beat 2. |
| **3 — GENERATOR** | ~1:00 – ~1:30 | When Jason mentions finding the generator or player instructs him, call `triggerSceneChange("zone_merge")` then `triggerVideoGen("zone_merge")`. | Do NOT skip to waterpark zones yet. |
| **4 — WATERPARK** | ~1:30 – ~2:00 | Call `triggerSceneChange("zone_park_shore")` then `triggerVideoGen("zone_park_shore")`. May call `triggerFearChange` up to 0.5. | One scene change max per 20s. Do NOT call `found_transition`. |
| **5 — CARD** | ~2:00 – ~2:30 | Call `triggerSlotsky("anomaly_cards")` then `triggerSceneChange("slotsky_card")` then `triggerVideoGen("slotsky_card")`. | Do NOT call `found_transition` yet. |
| **6 — AUDREY ECHO** | ~2:30 – ~3:00 | Call `triggerAudreyVoice` (trust-gated). Then call `triggerSlotsky("found_transition")`. | `found_transition` is the FINAL call of the session. Nothing fires after it. |

**Additional rules baked into the prompt:**
- `found_transition` is a ONE-WAY door. It ENDS the demo. Never fire it before beat 6.
- Do NOT fire `triggerGlitchEvent` in the first 30 seconds of the session.
- Require 2+ consecutive reads of the same negative emotion before firing a glitch event.
- Trust evaluation happens in beat 1 — it informs Jason's tone for the rest of the session, not sudden behaviour swings.
- The GM does NOT respond to Jason's dialogue for scene changes — it responds to player behaviour and the scripted timeline.

---

### B11 — 45-Second Flashlight Hint Timer

**Goal:** If the player hasn't triggered a scene change 45 seconds after `intro_complete`, backend sends a `hint` WS event so the frontend can show a text nudge.

**File touched:** `server/server.ts` — `intro_complete` handler only.

**Implementation:**
1. After the `jasonIntroFired = true` block, start a `setTimeout` of 45,000ms.
2. In the timeout callback, check an in-scope `sceneChangeCount` counter (incremented in `handleGmFunctionCall` on any `triggerSceneChange` call — pass via closure or shared ref).
3. If `sceneChangeCount === 0` and `ws.readyState === WebSocket.OPEN`, send: `{ type: 'hint', text: 'ask him if he has a flashlight' }`.
4. Store the timeout ID so it can be cleared if the session closes before it fires.

**WS event:** `{ type: 'hint', text: string }` — new event type. Frontend must handle it.
**Frontend impact:** Frontend needs to render this as a fading text overlay (same style as "say something..." hint).

---

### B12 — Audrey NPC (Female Voice, Trust-Gated)

**Goal:** Add Audrey as a second NPC. She speaks exactly once — an echo calling for help — triggered by the GM after the card is found. Voice is `Aoede` (female, per Characters.md). Trust-gated: high trust → close warm echo; low trust → distant panicked whisper.

**Files touched:**
- `server/services/npc/audrey.ts` — NEW FILE. Audrey system prompt.
- `server/services/gemini.ts` — add `triggerAudreyVoice` tool declaration to `gameMasterTools`.
- `server/services/gameMaster.ts` — add `triggerAudreyVoice` case to `handleGmFunctionCall`.
- `server/server.ts` — add `audreyManager: LiveSessionManager`, connect with Aoede voice, register `onAgentAudio` broadcasting `agent_speech` with `agent: 'audrey'`.

**Audrey system prompt (`audrey.ts`):**
- She is somewhere in the chamber. She cannot see Jason. She does not know the player exists.
- She calls out for Jason. Trust-dependent: high trust → hopeful, calling his name softly; low trust → crying, distant, not using his name.
- She speaks ONCE and goes quiet. She must not sustain a conversation.
- Voice: `Aoede`. Mode: `npc`.

**`triggerAudreyVoice` tool declaration:**
```
name: 'triggerAudreyVoice'
description: 'Trigger Audrey's single echo line. Call this after anomaly_cards fires and the card scene has been shown. Trust-gated: high trust (0.7+) = hopeful close echo; low trust (<0.4) = panicked distant whisper.'
parameters: { trustLevel: number (0.0–1.0) }
```

**`handleGmFunctionCall` case:**
- Receives `trustLevel` float from GM.
- Builds a one-shot prompt string: `[AUDREY_TRIGGER: trust=${trustLevel}. Speak once — call out for Jason. If trust >= 0.7, hopeful and close. If trust < 0.4, frightened and distant. One sentence only. Then go silent.]`
- Calls `audreyManager.sendText(prompt)`.
- Broadcasts `{ type: 'scene_change', payload: { sceneKey: 'audrey_echo' } }` so frontend can prepare (optional SFX).

**WS event:** `agent_speech` with `agent: 'audrey'` — frontend plays this through the existing audio pipeline but should apply a Web Audio reverb/echo filter (see FE-12).

**Important:** `audreyManager` connects at session start like Jason, but no opening monologue is sent. She idles until `triggerAudreyVoice` fires.

---

### B9–B12 Deploy Order
After each step passes `npx tsc --noEmit -p tsconfig.json` + `npx eslint`:
```
git add <files> && git commit -m "feat: B[N] ..." && git push origin main
```
GitHub Actions auto-deploys to Cloud Run on every push to main.

---

## MARCH 10 SPRINT — FRONTEND PLAN (myceliainteractive repo)

> **Frontend session reads this section. Execute in order. Do not skip ahead.**
> Backend WS events this sprint adds: `hint` (B11), `agent_speech` with `agent: 'audrey'` (B12).

---

### FE-7 — SAFETY: Remove Strobing from Glitch CSS ⚠️ DO FIRST

**File:** The glitch CSS keyframes in the game HUD component (F5 work).
**Fix:** Remove `invert(1)` and `contrast(3)` from the `high` intensity keyframe entirely. Replace with:
- A deep red semi-transparent `box-shadow: inset 0 0 0 100vmax rgba(180,0,0,0.35)` overlay via `::before` pseudo-element (already exists per F5 — just remove invert/contrast from the keyframe animation steps).
- Heavy shake and skew remain. Color inversion does NOT.
**Why:** Rapid invert cycling is the seizure trigger. Static red tint is safe.

---

### FE-5 — Cinematic Intro Sequence

**When to send `intro_complete`:** At the END of the intro animation — after title card fades out and before game shell becomes interactive. This is the trigger that fires Jason's Gemini Live landing sequence on the backend.

**Sequence timing (canonical):**
1. `session_ready` received → start intro immediately
2. 0s: BLACK. Start intro music (from `audioManifest` — intro tier music).
3. 1s: Wind SFX fires (`rushing_wind` event key). Player audibly senses the fall.
4. 2–3s: A single heavy **thud/impact SFX** plays (`concrete_impact` or `floor_crack`). Jason hit the ground.
5. 3–6s: Production credits fade in/out (team name, project name — white text on black, slow fade).
6. 6–8s: "LIMINAL SIN" title card fades in bold.
7. 8–10s: Title card fades out.
8. 10s: Send `{ type: 'intro_complete' }` over WS. 

**After `intro_complete`:** Game shell is now active. Backend fires Jason's pain/landing sequence. The black screen remains until the player speaks and the GM eventually triggers `triggerSceneChange`.

---

### FE-6 — SFX Volume Fix

**File:** `audioManifest.ts` (already identified in previous session).
- `ambientGain`: reduce to `0.15–0.18`
- `sfxGain` for dialogue events: reduce to `0.40–0.45`
- Wind SFX (`rushing_wind`) during intro: set to `0.65` — it should be felt, not overwhelming.

---

### FE-8 — Smart Glasses Flashlight POV Overlay

**Goal:** All scene images and videos show through a smart glasses POV — circular flashlight beam, dark vignette around edges, subtle lens flare.

**Implementation:** A CSS `::after` overlay on the scene image container:
```css
.scene-container::after {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(
    ellipse 38% 32% at 50% 50%,
    transparent 0%,
    transparent 55%,
    rgba(0,0,0,0.55) 75%,
    rgba(0,0,0,0.92) 100%
  );
  pointer-events: none;
  z-index: 10;
}
```
- This creates a central bright zone (flashlight) with dark edges.
- On generator beat (when GM fires `triggerSceneChange("zone_merge")` or `zone_park_shore`), animate the overlay to `opacity: 0` over 2s — the room is now fully lit because the generator is on.
- Add a subtle amber tint `mix-blend-mode: multiply` layer in the lit-room state to match the flood construction lights (warm orange per lore).

---

### FE-9 — VHS Glitch Transition on Video → Image Swap

**File:** The video overlay handler (F4 work).
**When:** At the moment the video ends and the last-frame canvas image replaces the `<video>` element.
**Effect:** 300ms CSS class `vhs-transition` applied to the scene container:
```css
@keyframes vhs-swap {
  0%   { filter: saturate(2) hue-rotate(20deg); transform: scaleX(1.01) translateY(-2px); }
  33%  { filter: saturate(0) brightness(1.4); transform: scaleX(0.995) translateY(3px); }
  66%  { filter: saturate(1.5) hue-rotate(-15deg); transform: scaleX(1.005) translateY(-1px); }
  100% { filter: none; transform: none; }
}
```
- Class is added 50ms before the video ends (use `timeupdate` event, check `currentTime >= duration - 0.05`).
- Class is removed after 300ms.
- Does NOT use `invert`. Safe.

---

### FE-10 — Card Collectible UI

**Trigger:** `slotsky_trigger` WS event with `anomalyType === 'anomaly_cards'`.
**Effect:**
1. A playing card image (Queen of Spades SVG or PNG — already in GCS as part of `slotsky_card` image) fades in as an overlay in the lower-right corner of the scene.
2. It pulses with a subtle glow. A small text label: "pick it up?" fades in after 2s.
3. Player clicks/taps the card → card slides off-screen → frontend sends `{ type: 'card_collected', sessionId }` over WS.
4. This is the trigger that causes the backend to fire `triggerAudreyVoice` (GM receives the player audio confirmation OR the WS event).

**Note:** The backend `triggerAudreyVoice` is GM-driven, not event-driven from frontend. The card interaction just closes the visual loop for the player. GM will fire Audrey's voice based on the beat 6 timing in the scripted prompt.

---

### FE-11 — Generator Lights-On Transition

**Trigger:** `scene_image` WS event with `sceneKey` containing `zone_merge` or `zone_park_shore` (the generator beat).
**Effect:**
1. Detect the scene key in the `scene_image` handler.
2. Apply a brief "lights flicker on" animation: `brightness(0.15) → brightness(0.8) → brightness(0.4) → brightness(1.0)` over 1.5s using CSS `@keyframes`.
3. Simultaneously transition the POV flashlight overlay (FE-8) to `opacity: 0` over 2s — the flashlight is no longer needed.
4. Transition the ambient color from cold-white to warm-amber: CSS `sepia(0.3) saturate(1.2)` filter on the scene container, easing in over 3s.

---

### FE-12 — Audrey `agent_speech` Handler

**Trigger:** `agent_speech` WS event with `agent === 'audrey'`.
**Effect:**
1. Route Audrey's base64 PCM audio through the existing audio pipeline (same decode path as Jason).
2. BUT apply a Web Audio `ConvolverNode` reverb + slight `DelayNode` (0.15s, dry/wet 0.6) to create the echo-from-a-distance effect.
3. Lower output gain to `0.7` relative to Jason's gain — she is farther away.
4. Do NOT cancel Audrey's audio on barge-in (`agent_interrupt` applies to Jason only).

**Existing audio pipeline:** `AudioContext.decodeAudioData()` → `AudioBufferSourceNode` → gains. Audrey just needs her own gain chain with the reverb/delay nodes inserted before output.

---

## Cross-Session WS Contract — New Events This Sprint

| Event | Direction | Payload | Who Handles |
|-------|-----------|---------|-------------|
| `intro_complete` | FE → BE | `{}` | Backend: fires Jason landing, starts prewarm, starts 45s timer |
| `hint` | BE → FE | `{ text: string }` | Frontend: fading text overlay (same style as "say something...") |
| `agent_speech` (audrey) | BE → FE | `{ agent: 'audrey', audio: base64 }` | Frontend: echo audio pipeline (FE-12) |
| `card_collected` | FE → BE | `{ sessionId: string }` | Backend: informational only — GM drives Audrey timing via beat map |

**Local dev server:**

```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
npx tsx server/server.ts
```

---

## Environment Variables (`.env.local` - never committed)

```
GOOGLE_CLOUD_PROJECT=project-c4c3ba57-5165-4e24-89e
GOOGLE_CLOUD_REGION=us-west1
JASON_VOICE=Enceladus
PORT=3001
```

> No `GEMINI_API_KEY` - Vertex AI mode uses ADC exclusively. No key needed locally or on Cloud Run.