# CURRENT_STATE.md - Liminal Sin Gemini

> **AI WORKING MEMORY** - This file is the source of truth for the current state of the project.
> Last updated: March 9, 2026 (Step G complete - Jason voice set to Enceladus)

---

## WARNING: NEXT AI SESSION - READ THIS FIRST

Before writing any code, read AGENTS.md and the mandatory docs in Section 9.
The server is backend-only (Cloud Run). All frontend code lives in the myceliainteractive repo.

---

## What Has Been Built - Session History

### Steps A-D (completed prior session)

1. **Backend server on Cloud Run** - `wss://liminal-sin-server-1071754889104.us-west1.run.app`
2. **Frontend WS connect** - deferred to "Begin Session" click to satisfy browser autoplay policy
3. **Mic capture** - `ScriptProcessorNode` at 16kHz, raw PCM Int16 -> base64 -> `player_speech` WS message
4. **JASON dialogue** - full back-and-forth, in-lore, Gemini Live native audio (was Fenrir voice)

### Steps E + F (completed March 9)

5. **Voice barge-in (Step F)** - `agent_interrupt` WS event cancels all queued `AudioBufferSourceNode`s in `GameHUD.tsx` instantly. Player can cut JASON off mid-sentence.
6. **Layered audio system (Step E)** - `audioManifest.ts` + `useAudioLayers.ts` in `app/ls/game/`. Three Web Audio channels: `musicGain`, `sfxGain`, `ambientGain`. All 83 audio files mapped to 28 event keys. Session-locked music picks, SFX anti-repeat, and volume micro-jitter ensure no two sessions sound identical.
7. **SIGNAL LOST bug** - `app/ls/judges/game/page.tsx` was missing the `connect()` call. Fixed.
8. **NotReadableError: Device in use** - fixed with `captureStartedRef` guard in `usePlayerMedia.ts`. `getUserMedia` now fires exactly once per session.

### Step G (completed March 9)

9. **Jason voice changed to Enceladus** - `voiceName` in `server/services/gemini.ts` updated from `Fenrir` to `Enceladus`. Committed and pushed.

---

## Remaining Steps to Demo

| Step | Feature | Status |
|------|---------|--------|
| A    | Backend Cloud Run server running | DONE |
| B    | Frontend WS connects on button click | DONE |
| C    | Mic capture - raw PCM 16kHz stream | DONE |
| D    | JASON dialogue - back and forth, in-lore | DONE |
| E    | Layered audio system (music / SFX / ambient) | DONE (GCS migration pending) |
| F    | Voice interrupt / barge-in | DONE |
| G    | Jason voice - Enceladus | DONE |
| H    | iOS cross-device compatibility fix | NEXT SESSION |
| I    | echoCancellation constraint (mic bleed fix) | NEXT SESSION |
| J    | GCS audio file storage + audioManifest update | NEXT SESSION |
| K    | GM trust routing - battle-tested with real session | PENDING |
| L    | Demo video (4 min, mandatory submission) | March 11-14 |
| M    | Architecture diagram (mandatory) | March 13-15 |

---

## Pending Work - Next Session Priorities

### Priority 1 - iOS / Cross-Device Compatibility

**Problem:** `usePlayerMedia.ts` creates its own `AudioContext` for mic capture at 16kHz. `GameHUD.tsx` creates a second `AudioContext` for playback at 24kHz. iOS Safari allows only one concurrent AudioContext - this will silently fail on iPhone/iPad.

**Fix:** Pass `audioCtxRef` from `GameHUD.tsx` into `usePlayerMedia` instead of creating a new context. Mic capture becomes a `createMediaStreamSource()` node on the shared context.

**Files touched:** `GameHUD.tsx` and `usePlayerMedia.ts` - no logic changes, context sharing only.

---

### Priority 2 - echoCancellation Constraint

Without this, speaker output (music/SFX) bleeds back into the mic and confuses JASON's VAD (voice activity detection).

In `usePlayerMedia.ts`, change `audio: true` on `getUserMedia` to:

```ts
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000,
}
```

**iOS note:** Omit `sampleRate: 16000` on iOS - it ignores it and can throw a constraint error. Use UA sniffing or a `try/catch` fallback.

---

### Priority 3 - Audio Files to Google Cloud Storage

83 audio files (~120-250MB total) must NOT be in git. Cloudflare Pages has a 25MB per-file limit and large binary files bloat git history permanently.

**Plan: GCS public bucket**
- GCP project: `project-c4c3ba57-5165-4e24-89e`
- Bucket name: `liminal-sin-assets`
- Audio paths: `gs://liminal-sin-assets/audio/music/` and `gs://liminal-sin-assets/audio/sfx/`
- Public URL pattern: `https://storage.googleapis.com/liminal-sin-assets/audio/music/music_intro.mp3`
- Configure CORS for `myceliainteractive.com`
- Update all 83 paths in `audioManifest.ts` to GCS URLs
- Add `public/assets/music/` and `public/assets/sound_fx/` to `.gitignore` in myceliainteractive

**Setup commands (run once):**

```bash
gcloud storage buckets create gs://liminal-sin-assets \
  --project=project-c4c3ba57-5165-4e24-89e \
  --location=us-west1 \
  --uniform-bucket-level-access

gcloud storage buckets add-iam-policy-binding gs://liminal-sin-assets \
  --member=allUsers \
  --role=roles/storage.objectViewer

gcloud storage cp -r "public/assets/music/*" gs://liminal-sin-assets/audio/music/
gcloud storage cp -r "public/assets/sound_fx/*" gs://liminal-sin-assets/audio/sfx/
```

---

### Priority 4 - Pending User Action (Manual)

Rename this file in `public/assets/music/`:

```
Psychosis_Apparatus_2026-03-08T204945 (1).mp3  -->  music_psychosis.mp3
```

This is the audio asset for the `fourth_wall_correction` trigger. The manifest expects `music_psychosis.mp3`.

---

## Timeline

| Date | Milestone |
|------|-----------|
| March 9, 2026 | Steps E + F + G complete and pushed |
| March 10, 2026 | iOS fix + echoCancellation + GCS migration |
| March 11, 2026 @ 11:11 PM MT | **Internal prototype cutoff** - full demo must be functional |
| March 12-14 | Demo video recording + architecture diagram |
| March 15 | Submission prep, final review |
| **March 16, 2026 @ 5:00 PM PDT** | **HARD DEADLINE** |

---

## Active Project Identity

| Field | Value |
|-------|-------|
| Project | Liminal Sin - FMV psychological horror experience |
| Contest | Gemini Live Agent Challenge (Google / Devpost) |
| Hard Deadline | March 16, 2026 @ 5:00 PM PDT |
| Internal Cutoff | March 11, 2026 @ 11:11 PM MT |
| Days to Internal Cutoff | 2 days |
| Days to Hard Deadline | 7 days |
| Backend Repo | `d:\DEV\liminal-sin-gemini` (Cloud Run Node.js - NO frontend code) |
| Frontend Repo | `myceliainteractive` (Cloudflare Pages - SEPARATE REPO) |
| Marketing Shell | https://myceliainteractive.com/ls - LIVE |
| Judge Backdoor | https://myceliainteractive.com/ls/judges - LIVE |
| Game Wrapper | https://myceliainteractive.com/ls/game - LIVE |
| Judge Game Wrapper | https://myceliainteractive.com/ls/judges/game - LIVE |

---

## GCP Infrastructure

| Resource | Value |
|----------|-------|
| GCP Project ID | `project-c4c3ba57-5165-4e24-89e` |
| GCP Project Name | Mycelia Interactive |
| GCP Account | `digitalartifact11@gmail.com` |
| Server Region | `us-west1` |
| Gemini Live Region | `us-central1` (required - Live API only available here) |
| Auth Method | Application Default Credentials (ADC) |
| Gemini Live Model | `gemini-live-2.5-flash-native-audio` |
| Firestore | Native mode, `us-west1` - CONNECTED |
| Cloud Run | LIVE - `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| GCS Bucket | `gs://liminal-sin-assets` - TO BE CREATED for audio files |

---

## Backend Server - All Phases Complete

| File | Purpose |
|------|---------|
| `server/server.ts` | Express + WebSocket server, PORT 3001 locally / 8080 on Cloud Run |
| `server/types/state.ts` | TrustLevel, PlayerEmotion, PlayerSession, GmEvent type definitions |
| `server/services/db.ts` | Firestore ADC client with in-memory fallback for local dev |
| `server/services/gemini.ts` | Vertex AI Live client, GM tool declarations, `LiveSessionManager` |
| `server/services/gameMaster.ts` | GM function call router - writes to Firestore, broadcasts to WS |
| `server/services/imagen.ts` | Imagen 4 scene generation - 7 zone prompts, returns base64 JPEG |
| `server/services/npc/jason.ts` | Jason system prompt v2 - trust + fear floats injected at session start |
| `Dockerfile` | 2-stage build (node:20-alpine), Cloud Run ready |

**Local dev server:**

```powershell
# Kill any existing node processes first
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