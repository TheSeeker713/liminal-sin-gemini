# CURRENT_STATE.md â€” Liminal Sin Gemini
> **AI WORKING MEMORY** â€” This file is overwritten at the start of every new AI session.
> Last updated: March 9, 2026 (full sprint â€” Steps E + F complete, audio system live)

---

## âš ï¸ NEXT AI SESSION â€” READ THIS FIRST

### What was completed â€” March 8â€“9 session (full sprint)

**Steps Aâ€“D (completed prior session):**
1. Backend server live on Cloud Run â€” `wss://liminal-sin-server-1071754889104.us-west1.run.app`
2. Frontend WS connects on "Begin Session" button click (autoplay policy satisfied)
3. Mic capture â€” `ScriptProcessorNode` at 16kHz, raw PCM Int16 â†’ base64 â†’ `player_speech`
4. JASON dialogue working â€” back and forth, in-lore, Gemini Live native Fenrir voice

**Steps E + F (completed March 9):**
5. **Step F â€” Voice interrupt / barge-in** â€” `agent_interrupt` WS event cancels all queued `AudioBufferSourceNode`s in `GameHUD.tsx` immediately. Player can speak over JASON and cut him off.
6. **Step E â€” Layered audio system** â€” `audioManifest.ts` + `useAudioLayers.ts` created in `app/ls/game/`. 3-channel Web Audio stack: `musicGain` / `sfxGain` / `ambientGain`. All 83 audio files mapped across 28 keys. Every WS event wired to an audio trigger. 3-layer randomisation ensures no two sessions sound identical (session-locked music picks, SFX anti-repeat, volume micro-jitter).
7. **SIGNAL LOST bug fixed** â€” `app/ls/judges/game/page.tsx` was missing `connect()` call. Fixed.
8. **NotReadableError: Device in use** â€” fixed by adding `captureStartedRef` guard in `usePlayerMedia.ts`. `getUserMedia` now called exactly once per session activation.

---

### âš ï¸ PENDING WORK â€” NEXT SESSION PRIORITIES

#### Priority 1 â€” Jason's Voice Change (MUST DO BEFORE DEMO)
Current voice: `Fenrir` (hardcoded in `server/services/gemini.ts` line 195).
The voice must be changed â€” user needs to test all available voices in browser first.

**Voice testing plan:**
1. Make `voiceName` a configurable parameter in `LiveSessionManager.connect()` in `server/services/gemini.ts` â€” accept an optional `voiceName: string` param, default to `'Fenrir'` until changed.
2. Read voice name from `process.env.JASON_VOICE` so it can be changed without code deploy.
3. In `myceliainteractive`, create a static test page at `public/voice-test.html` â€” a self-contained HTML file (no Next.js needed) that:
   - Connects to the live WS server
   - Has a dropdown of ALL available Gemini Live prebuilt voices
   - Has a text input for a test line ("There's something moving in the water.")
   - Plays the response audio directly in the browser
   - No deploy required â€” user can open it via `localhost:3000/voice-test.html` or directly from the file system

**Available Gemini Live prebuilt voices (2026 GA):**
`Puck` `Charon` `Kore` `Fenrir` `Aoede` `Orbit` `Zephyr` `Leda` `Callisto` `Constellation` `Vesper` `Nova` `Rigel` `Umbriel` `Algenib` `Achernar` `Alnair` `Schedar`

User will listen and pick the best voice for Jason (cinematic male, stressed, controlled horror narrator).
Once picked: update `JASON_VOICE` env var on Cloud Run (no code deploy needed).

#### Priority 2 â€” iOS / Cross-Device Compatibility
**Problem:** `usePlayerMedia.ts` creates its own `AudioContext` (for mic capture at 16kHz). `GameHUD.tsx` creates a second `AudioContext` (for playback at 24kHz). iOS Safari limits concurrent AudioContexts â€” this will silently fail on iPhone/iPad.

**Fix:** Pass the single `audioCtxRef` from `GameHUD.tsx` into `usePlayerMedia` rather than creating a second one. The mic capture context should be a child of the single shared context using `createMediaStreamSource()` â€” which works on the same `AudioContext` as playback.

**Impact:** Both `GameHUD.tsx` and `usePlayerMedia.ts` need touching. This is a safe refactor â€” no logic changes, only context sharing.

#### Priority 3 â€” echoCancellation Constraint (prevents music bleed into mic)
Without this, speakers playing music/SFX will bleed back into the mic and confuse JASON's VAD.

In `usePlayerMedia.ts`, change `audio: true` on `getUserMedia` to:
```ts
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000,
}
```
Note: On iOS, omit `sampleRate: 16000` â€” iOS ignores it and it can cause constraint errors. Use UA sniffing or a try/catch fallback.

#### Priority 4 â€” Audio File Storage â€” GCS (NOT git)
83 audio files (~120â€“250MB total) must NOT be pushed to git. Cloudflare Pages has a 25MB per-file limit on deployments, and large files bloat git history permanently.

**Decision: Google Cloud Storage bucket**
- GCP project already exists: `project-c4c3ba57-5165-4e24-89e`
- Create a public GCS bucket: `liminal-sin-assets`
- Upload all audio to: `gs://liminal-sin-assets/audio/music/` and `gs://liminal-sin-assets/audio/sfx/`
- Public URL pattern: `https://storage.googleapis.com/liminal-sin-assets/audio/music/music_intro.mp3`
- Configure CORS on bucket to allow requests from `myceliainteractive.com`
- Update `audioManifest.ts` in myceliainteractive to use GCS URLs (all 83 paths)
- Add `public/assets/music/` and `public/assets/sound_fx/` to `.gitignore` in myceliainteractive

**GCS bucket setup commands (run once):**
```bash
gcloud storage buckets create gs://liminal-sin-assets --project=project-c4c3ba57-5165-4e24-89e --location=us-west1 --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://liminal-sin-assets --member=allUsers --role=roles/storage.objectViewer
gcloud storage cp -r "D:\DEV\Coding Projects\Company and business projects\myceliainteractive\public\assets\music\*" gs://liminal-sin-assets/audio/music/
gcloud storage cp -r "D:\DEV\Coding Projects\Company and business projects\myceliainteractive\public\assets\sound_fx\*" gs://liminal-sin-assets/audio/sfx/
```

#### Priority 5 â€” Pending User Action
User must rename `Psychosis_Apparatus_2026-03-08T204945 (1).mp3` â†’ `music_psychosis.mp3` in `public/assets/music/`. This file is the `fourth_wall_correction` music trigger.

---

### Remaining Steps to Demo

| Step | Feature | Status |
|---|---|---|
| A | Backend Cloud Run server running | âœ… Complete |
| B | Frontend WS connects on button click | âœ… Complete |
| C | Mic capture â€” raw PCM 16kHz stream | âœ… Complete |
| D | JASON dialogue â€” back and forth, in-lore | âœ… Complete |
| E | Layered audio system (music/SFX/ambient) | âœ… Complete (GCS migration pending) |
| F | Voice interrupt / barge-in | âœ… Complete |
| G | Jason's voice â€” browser test + change | â³ Next session |
| H | iOS cross-device compatibility fix | â³ Next session |
| I | echoCancellation constraint | â³ Next session |
| J | GCS audio file storage + audioManifest update | â³ Next session |
| K | GM trust routing fully battle-tested with real session | â³ Pending |
| L | Demo video (4 min, mandatory submission) | â³ March 11â€“14 |
| M | Architecture diagram (mandatory) | â³ March 13â€“15 |

---

### Timeline

| Date | Milestone |
|---|---|
| March 9, 2026 (today) | Steps E + F complete and pushed |
| March 10, 2026 | Voice change + iOS fix + echoCancellation + GCS migration |
| March 11, 2026 @ 11:11 PM MT | **Internal prototype cutoff** â€” full demo functional |
| March 12â€“14 | Demo video recording + architecture diagram |
| March 15 | Submission prep, final review |
| **March 16, 2026 @ 5:00 PM PDT** | **HARD DEADLINE** |

---

### Backend Voice Config â€” Where to Change Jason's Voice

File: `server/services/gemini.ts` line ~195
```ts
prebuiltVoiceConfig: { voiceName: 'Fenrir' }
```
Change to read from env var:
```ts
prebuiltVoiceConfig: { voiceName: process.env.JASON_VOICE ?? 'Fenrir' }
```
Then set `JASON_VOICE=<chosen_voice>` on Cloud Run:
```bash
gcloud run services update liminal-sin-server --region=us-west1 --update-env-vars JASON_VOICE=<voice>
```
No rebuild required â€” just a service update restart.

---

## Active Project Identity

| Field | Value |
|---|---|
| **Project** | Liminal Sin â€” FMV psychological horror experience |
| **Contest** | Gemini Live Agent Challenge (Google / Devpost) |
| **Hard Deadline** | March 16, 2026 @ 5:00 PM PDT |
| **Internal Prototype Cutoff** | March 11, 2026 @ 11:11 PM MT |
| **Days to Internal Cutoff** | 2 days |
| **Days to Hard Deadline** | 7 days |
| **Backend Repo** | `d:\DEV\liminal-sin-gemini` (Cloud Run Node.js server â€” NO frontend code) |
| **Frontend Repo** | `myceliainteractive` (Cloudflare Pages â€” SEPARATE REPO) |
| **Marketing Shell** | `https://myceliainteractive.com/ls` â€” LIVE |
| **Judge Backdoor** | `https://myceliainteractive.com/ls/judges` â€” LIVE |
| **Game Wrapper** | `https://myceliainteractive.com/ls/game` â€” LIVE |
| **Judge Game Wrapper** | `https://myceliainteractive.com/ls/judges/game` â€” LIVE |

---

## GCP Infrastructure â€” PROVISIONED

| Resource | Value |
|---|---|
| **GCP Project ID** | `project-c4c3ba57-5165-4e24-89e` |
| **GCP Project Name** | Mycelia Interactive |
| **Region** | `us-west1` (server) / `us-central1` (Gemini Live â€” required) |
| **Auth method** | Application Default Credentials (ADC) |
| **Gemini Live model** | `gemini-live-2.5-flash-native-audio` |
| **Firestore** | Native mode, `us-west1` â€” CONNECTED |
| **Cloud Run** | âœ… LIVE â€” `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| **GCS bucket (pending)** | `gs://liminal-sin-assets` â€” TO BE CREATED for audio files |
| **GCP Account** | `digitalartifact11@gmail.com` |

---

## Backend Server â€” ALL PHASES COMPLETE

| File | Status | Purpose |
|---|---|---|
| `server/server.ts` | âœ… | Express + WebSocket server, PORT 3001 / 8080 (Cloud Run) |
| `server/types/state.ts` | âœ… | TrustLevel, PlayerEmotion, PlayerSession, GmEvent types |
| `server/services/db.ts` | âœ… | Firestore ADC + in-memory fallback |
| `server/services/gemini.ts` | âœ… | Vertex AI Live client, GM tools, `LiveSessionManager` |
| `server/services/gameMaster.ts` | âœ… | GM function call router â†’ Firestore + WS broadcast |
| `server/services/imagen.ts` | âœ… | Imagen 4 scene generation â€” 7 zone prompts â†’ base64 JPEG |
| `server/services/npc/jason.ts` | âœ… | Jason system prompt v2 â€” trust + fear injected at runtime |
| `Dockerfile` | âœ… | 2-stage build (node:20-alpine), Cloud Run ready |

### Server startup (local dev):
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
npx tsx server/server.ts
```

---

## Environment Variables (`.env.local` — never committed)

```
GOOGLE_CLOUD_PROJECT=project-c4c3ba57-5165-4e24-89e
GOOGLE_CLOUD_REGION=us-west1
JASON_VOICE=Fenrir
PORT=3001
```
> No `GEMINI_API_KEY` — Vertex AI mode uses ADC exclusively.
> Add `JASON_VOICE=<chosen_voice>` after browser voice test to swap Jason's voice without redeploy.