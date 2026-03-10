# CURRENT_STATE.md - Liminal Sin Gemini (Backend)

> **AI WORKING MEMORY** - This file is the source of truth for the current state of the backend project.
> Last updated: March 9, 2026 (Full today schedule: Veo 3.1 Fast pipeline + frontend prerequisites mapped — ALL backend work today)

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
| **B1** | **Create `services/veo.ts` — Veo 3.1 Fast img2vid** | **TODAY** |
| **B2** | **Add `triggerVideoGen` GM tool declaration to `gemini.ts`** | **TODAY** |
| **B3** | **Wire `triggerVideoGen` in `gameMaster.ts` → `scene_video` WS event** | **TODAY** |
| **F1** | **Frontend: Black screen opening + `session_ready` handler** | **TODAY (frontend prereq)** |
| **F2** | **Frontend: GM red eye indicator** | **TODAY (frontend prereq)** |
| **F3** | **Frontend: Scene image display (`scene_image` → crossfade)** | **TODAY (frontend prereq)** |
| **F4** | **Frontend: `scene_video` handler — play clip, freeze on last frame** | **TODAY (frontend prereq)** |
| **B4** | **Verify + upload remaining assets to GCS** | **TODAY** |
| **B5** | **GM trust routing battle-test (Step L) — requires F1+F3 first** | **TODAY** |
| F5   | Frontend: Glitch effects CSS | TODAY |
| F6   | Frontend: Demo end sequence | TODAY |
| N    | Demo video (4 min, mandatory submission) | March 11-14 |
| O    | Architecture diagram (mandatory) | March 13-15 |

---

## Today's Full Work Schedule (March 9 — ALL BACKEND + REQUIRED FRONTEND)

> **Execute in this order. Do not skip ahead.**
> Frontend steps F1-F4 are prerequisites for backend end-to-end testing.

---

### B1 — Create `services/veo.ts` (Veo 3.1 Fast)

New file. Veo 3.1 Fast image-to-video generation.
- Takes `sceneKey` (string) + `referenceImageBase64` (JPEG from Imagen 4) as input
- Constructs a generation request to Vertex AI Veo 3.1 Fast model
- Returns signed GCS URL or base64 video data
- Non-blocking async — called after `generateSceneImage()` resolves
- **NEVER use Veo 2. Model: Veo 3.1 Fast only.**

**Files:** `server/services/veo.ts` (new file)

---

### B2 — Add `triggerVideoGen` GM Tool Declaration (`gemini.ts`)

Add a new tool to the GM tool declarations array:
- `triggerVideoGen(sceneKey: string)` — fired by GM after `triggerSceneChange` resolves
- GM description: "Animate the current static scene image into a short video clip using Veo 3.1 Fast. Call this after triggerSceneChange when you want the scene to feel alive."

**Files:** `server/services/gemini.ts` (append to GM_TOOLS array)

---

### B3 — Wire `triggerVideoGen` in `gameMaster.ts`

Add case to `handleGmFunctionCall` switch:
- Looks up last generated `base64` for this session (store it on the session object after `generateSceneImage` resolves)
- Calls `generateSceneVideo(sceneKey, base64)` from `veo.ts` async
- On resolve: broadcasts `scene_video` WS event `{ type: 'scene_video', payload: { sceneKey, url } }` to frontend

**Files:** `server/services/gameMaster.ts`

---

### F1 — Frontend: Black Screen Opening (FRONTEND PREREQ)

Required before B5 testing. See frontend CURRENT_STATE.md Priority 1 (Step K).
- `GameHUD.tsx` initial `sceneImage` state = `null` → renders pure black background
- `session_ready` handler triggers ambient SFX loop
- CSS text overlay fades in after ~10s

---

### F2 — Frontend: GM Red Eye Indicator (FRONTEND PREREQ)

Required for demo quality. See frontend CURRENT_STATE.md Priority 1 (Step M).
- Animated SVG eye, top-right corner, opacity oscillates 0.3–1.0
- Triggered on `session_ready`, removed on session close

---

### F3 — Frontend: Scene Image Display (FRONTEND PREREQ)

Required before B5 testing. See frontend CURRENT_STATE.md Priority 3 (Step L).
- `scene_image` WS event → decode base64 → crossfade to new background
- `GameWSContext.tsx` + `GameHUD.tsx`

---

### F4 — Frontend: `scene_video` Handler (FRONTEND PREREQ for B3 E2E test)

New step. See frontend CURRENT_STATE.md (Step P).
- `scene_video` WS event arrives with video URL or base64
- Play short clip as overlay over current scene image
- On clip end: freeze on last frame (keep it as new `sceneImage`)
- Non-disruptive if video is slow to arrive — still image already showing

---

### B4 — Verify + Upload Remaining Assets to GCS

Verify what's already in `gs://liminal-sin-assets/` then upload any missing:
```powershell
gsutil ls gs://liminal-sin-assets/video/clips/
gsutil ls gs://liminal-sin-assets/audio/voice_overs/
gsutil ls gs://liminal-sin-assets/audio/podcasts/
```
If missing:
- `assets/Clips/*.mp4` → `gs://liminal-sin-assets/video/clips/`
- `assets/Audio/Voice_Overs/*` → `gs://liminal-sin-assets/audio/voice_overs/`
- `assets/Audio/podcasts/*` → `gs://liminal-sin-assets/audio/podcasts/`

Audio already migrated: 17 music + 66 SFX = 83 files confirmed.

---

### B5 — GM Trust Routing Battle-Test (Step L)

**REQUIRES F1 + F3 to be complete first.**

Battle-test the full GM → Firestore → WS → frontend pipeline:
- GM hears player speech, evaluates trust/fear
- Fires: `triggerTrustChange`, `triggerFearChange`, `triggerGlitchEvent`, `triggerSceneChange`, `triggerVideoGen`
- Jason receives live trust context injection
- Frontend receives and renders all events

**Debug endpoint:** `POST /debug/fire-gm-event` for manual event injection.

---

### F5 + F6 — Frontend: Glitch Effects + Demo End Sequence

See frontend CURRENT_STATE.md Priorities 4 + 5. Complete after B5 passes.

~~Priority 1 — Fix Session Opening (BLACK SCREEN)~~ — DONE
Completed March 9. Session opens with JASON's initial monologue only — pure audio, black screen.

---

## Frontend Work (for myceliainteractive repo)

These items are documented here so the frontend session has full context:

### 1. GM Red Eye Indicator
CSS/JS animated red eye in screen corner. Fades in/out. Lets player/judges know the GM is watching.
Triggered by `session_ready` WS event. Always present during gameplay.

### 2. Black Screen Opening
Game starts BLACK. No `<img>` or `<video>` element visible.
SFX triggers: falling, crash, ambient underground.
Text overlay hint fades in after ~10s: "say something..."

### 3. Scene Image Display
When `scene_image` WS event arrives, crossfade from black (or previous image) to new image.
Hold image as background until next `scene_image` arrives.

### 4. Demo End Sequence
On `slotsky_trigger` with `found_transition`:
- Stop requesting new scenes
- Hold final image
- Play end animation/overlay
- Close session gracefully

---

## Timeline

| Date | Milestone |
|------|-----------|
| March 9, 2026 | Steps A-K2 complete. **Today:** B1 (Veo service) → B2 (GM tool) → B3 (wire) → F1-F4 (frontend prereqs) → B4 (GCS) → B5 (trust battle-test) → F5-F6 (polish). ALL backend + frontend done today. |
| March 10, 2026 | Integration testing. Full 3-minute demo playthrough end-to-end. Fix any issues surfaced in battle-test. |
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
| `server/services/npc/jason.ts` | Jason system prompt v2 — trust + fear floats injected at session start |
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