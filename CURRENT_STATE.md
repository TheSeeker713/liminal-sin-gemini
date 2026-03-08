# CURRENT_STATE.md — Liminal Sin Gemini
> **AI WORKING MEMORY** — This file is overwritten at the start of every new AI session.
> Last updated: March 8, 2026 (late evening — Steps B/C/D live, mic pipeline diagnosed)

---

## ⚠️ NEXT AI SESSION — READ THIS FIRST

### What was completed — March 8 session (full sprint day)

**Morning (from previous session baseline):**
1. **Gemini Live model fixed** — `gemini-live-2.5-flash-native-audio` (GA as of March 2026)
2. **Live API region fixed** — separate `liveAi` client targeting `us-central1`
3. **Both smoke tests PASS** — `npm run test:audio` → `✅ SESSION_READY` + 43 `agent_speech` chunks
4. **Jason demo prompt v2** — `server/services/npc/jason.ts`: fearIndex param, opening monologue trigger
5. **GM session fixed** — AUDIO modality, `sendToolResponse()`, `callId` chain, trust enum mapping

**Afternoon/Evening (this session — Steps B, C, D):**

6. **Step B — Imagen 4 scene generation** — `server/services/imagen.ts` created. `triggerSceneChange` GM function call → Vertex AI `imagen-4.0-generate-001` → first-person POV JPEG → broadcast `{ type: 'scene_image', data: base64jpeg }` over WebSocket. 7 zone prompts keyed by `sceneKey`. `gameMaster.ts` wired to call Imagen on every `triggerSceneChange` event.
7. **Step C — Frontend scene_image rendering** — `GameWSContext.tsx` receives `scene_image` events, stores base64 in `sceneImage` state. `GameHUD.tsx` renders it as crossfade `<img>` background (z-0, 1s CSS transition). ✅ Confirmed working in browser — tunnel image visible.
8. **Step D — Webcam frame pipe** — `usePlayerMedia.ts` captures canvas snapshots every 1 second → base64 JPEG → sends `{ type: 'player_frame', jpeg: b64 }` to server. `server.ts` routes `player_frame` events to `gmManager.sendFrame(data.jpeg)`. ✅ Confirmed webcam working.
9. **IAM permissions fixed** — Cloud Run service account granted `roles/aiplatform.user` + `roles/datastore.user`. Live smoke test PASS against `wss://liminal-sin-server-1071754889104.us-west1.run.app`.
10. **WSS URL fixed** — `.env.production` updated to `wss://liminal-sin-server-1071754889104.us-west1.run.app` (the canonical `zihz3so5tq` URL redirects and breaks WebSocket upgrades).
11. **Audio pipeline (partial fix)** — WS connect deferred to "Begin Session" button click (satisfies AudioContext autoplay policy). `MediaRecorder` replaced with `ScriptProcessorNode` at 16kHz (Gemini Live requires raw PCM, not Opus/WebM). Frontend AudioContext for playback created in same click gesture.
12. **JASON's intro audio confirmed working** — User hears JASON speak first on session start. Proves: WS connect ✅, session_ready ✅, Gemini Live session ✅, agent_speech → AudioContext playback ✅.

---

### ❌ ACTIVE BUG: Microphone → JASON pipeline broken

**Symptom:** JASON hears nothing. JASON speaks his intro but never responds to the player's voice.

**Evidence from browser console (Chrome DevTools screenshot taken):**
```
[usePlayerMedia] Media access error: NotReadableError: Device in use
```

**Root cause identified:** `usePlayerMedia.ts` `stopAll()` calls `void micCtxRef.current?.close()` — the `void` means it's fire-and-forget (not awaited). When the React `useEffect` re-fires (e.g., `status` changes from `connecting` → `open`), the old AudioContext may not have fully released the mic hardware before the new `getUserMedia({audio:true, video:...})` call. Chrome throws `NotReadableError: Device in use`.

**Important:** The WS event type is CORRECT. `usePlayerMedia.ts` sends `{ type: "player_speech", audio: btoa(raw) }` which matches the server handler `if (data.type === 'player_speech' && data.audio)`. There is NO event type mismatch — that hypothesis was wrong.

**Fix plan for next session:**

Option A (simplest — fix the stale closure / double-init):
- Guard `getUserMedia` with a ref flag (`isInitialized.current`) so it only runs once per mount, not on every `status` change.
- Move `getUserMedia` call OUT of the effect that watches `status`. Instead, expose a `startCapture()` function and call it once from `GameHUD.tsx` after WS `session_ready` is confirmed.

Option B (defensive re-architecture):
- In `stopAll()`, `await micCtx.close()` properly by making `stopAll` async, or explicitly disconnect `micSource` and `processor` nodes before closing the context.
- Add `micSource.disconnect(); processor.disconnect();` before `micCtxRef.current.close()`.

**Recommended fix: Option A** — restructure `usePlayerMedia` to expose a `startCapture()` function instead of auto-starting on `status === 'open'`, call it from `GameHUD.tsx` once `session_ready` event fires.

---

### ⚡ NEXT SESSION — Fix mic, then Steps E & F

**IMMEDIATE: Fix `NotReadableError: Device in use` in `usePlayerMedia.ts`**
- Read `app/ls/game/usePlayerMedia.ts` and `app/ls/game/GameHUD.tsx` before touching anything
- Key: `getUserMedia` must only be called ONCE, inside a user-gesture triggered flow, after WS is confirmed open
- Do NOT add a second AudioContext if `GameHUD.tsx` already has one open for playback

**Step E — Three-channel Web Audio** (myceliainteractive repo)
- Jason voice channel: gain 1.0
- Ambient SFX channel: gain 0.6
- Music background channel: gain 0.3
- `fadeIn`, `fadeOut`, `setVolume`, `loop` controls per channel

**Step F — Trust float injection** (backend)
- Read Firestore `trustLevel` per session
- Inject current float value into Jason's system prompt on each turn
- Broadcast `trust_update` WS event to frontend HUD

### Server startup (always do this first):
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
npx tsx server/server.ts
# In second terminal:
npm run test:audio
```

---

## Active Project Identity

| Field | Value |
|---|---|
| **Project** | Liminal Sin — FMV psychological horror experience |
| **Contest** | Gemini Live Agent Challenge (Google / Devpost) |
| **Hard Deadline** | March 16, 2026 @ 5:00 PM PDT |
| **Internal Prototype Cutoff** | March 11, 2026 @ 11:11 PM MT |
| **Days to Internal Cutoff** | 4 days |
| **Days to Hard Deadline** | 9 days |
| **Backend Repo** | `d:\DEV\liminal-sin-gemini` (Cloud Run Node.js server — NO frontend code) |
| **Frontend Repo** | `myceliainteractive` (Cloudflare Pages — SEPARATE REPO, not in this workspace) |
| **Marketing Shell** | `https://myceliainteractive.com/ls` — LIVE |
| **Judge Backdoor** | `https://myceliainteractive.com/ls/judges` — LIVE |
| **Game Wrapper** | `https://myceliainteractive.com/ls/game` — LIVE |
| **Judge Game Wrapper** | `https://myceliainteractive.com/ls/judges/game` — LIVE |

---

## GCP Infrastructure — PROVISIONED

| Resource | Value |
|---|---|
| **GCP Project ID** | `project-c4c3ba57-5165-4e24-89e` |
| **GCP Project Name** | Mycelia Interactive |
| **Region** | `us-west1` |
| **Auth method** | Application Default Credentials (ADC) — `gcloud auth application-default login` |
| **Gemini SDK mode** | Vertex AI (`vertexai: true`) — bills against $300 GCP credits |
| **Firestore** | Native mode, `us-west1` — CONNECTED |
| **Firebase Web App** | `liminal-sin-web` — registered |
| **Cloud Run** | ✅ LIVE — `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| **Artifact Registry** | ✅ `liminal-sin-repo` created in `us-west1` |
| **Cloud Run Env Vars** | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION` set on service |
| **GCP Account** | `digitalartifact11@gmail.com` |

---

## Backend Server — PHASES 1–4 COMPLETE

### What Is Built (`liminal-sin-gemini` repo)

| File | Status | Purpose |
|---|---|---|
| `server/server.ts` | ✅ Done | Express + WebSocket server on PORT 3001 (local) / 8080 (Cloud Run) |
| `server/types/state.ts` | ✅ Done | TrustLevel enum, PlayerEmotion, PlayerSession, GmEvent types |
| `server/services/db.ts` | ✅ Done | Firestore ADC adapter with in-memory fallback |
| `server/services/gemini.ts` | ✅ Done | Vertex AI client + GM system prompts + 4 tool declarations + `LiveSessionManager` class |
| `server/services/gameMaster.ts` | ✅ Done | GM function call router — persists state + broadcasts GmEvent over WS + calls Imagen 4 |
| `server/services/imagen.ts` | ✅ Done | 7 zone prompts + `generateSceneImage(sceneKey)` → Imagen 4 → base64 JPEG |
| `server/services/npc/jason.ts` | ✅ Done | Jason demo system prompt v2 — fearIndex + trust injected at runtime, opening monologue trigger |
| `server/tsconfig.build.json` | ✅ Done | Emits compiled JS to `dist/server/server.js` |
| `Dockerfile` | ✅ Done | 2-stage build (node:20-alpine), Cloud Run ready |
| `.gcloudignore` | ✅ Done | Strips docs/assets/public from Cloud Build upload |

### What the Server Currently Does (Reality Check — March 7, 2026)
- Accepts WebSocket connections
- On connect: opens a `LiveSessionManager` → calls `ai.live.connect()` → sends `SESSION_READY` to client
- Routes `player_speech` JSON messages (base64 PCM) → `liveManager.sendAudio()`
- Routes raw binary audio frames → `liveManager.sendAudio()` (fallback)
- Streams `agent_speech` audio chunks back to frontend over WebSocket
- Forwards `agent_interrupt` signal to frontend on barge-in
- Routes GM function calls → `gameMaster.ts` → Firestore + WS broadcast
- **Deployed on Cloud Run — health check live. End-to-end audio path is wired but UNTESTED with a real frontend client.**

### What Does NOT Exist Yet
- [ ] **End-to-end audio test** — `player_speech` → Gemini → `agent_speech` loop not validated with a real browser client yet
- [ ] Webcam frame pipe (GM vision: 1 JPEG/sec → `sendFrame()`)
- [ ] NPC character system prompts (Jason, Audrey, Josh) injected per session
- [ ] VAD / barge-in handler (player speaks → truncate Gemini output queue)
- [ ] FMV scene switching (frontend reads `SCENE_CHANGE` GmEvent, swaps video)
- [x] Frontend game wrapper (`/ls/game`) — DONE in myceliainteractive repo
- [x] Cloud Run deployment — LIVE at `https://liminal-sin-server-1071754889104.us-west1.run.app`
- [ ] **End-to-end audio test** — `player_speech` → Gemini → `agent_speech` loop not validated with a real browser client yet
- [x] Jason's demo system prompt + `voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }` injected
- [x] Opening monologue trigger (Jason speaks first on session start)
- [ ] Webcam frame pipe (GM vision: 1 JPEG/sec → `sendFrame()`)
- [ ] Imagen 3 scene generation — server calls Vertex AI Imagen 3 when `scene_key` changes
- [ ] Trust float injection — Jason’s prompt updated with current `trust_level` value
- [ ] VAD / barge-in handler (player speaks → truncate Gemini output queue)
- [ ] `deploy.yml` env vars — `--set-env-vars` not yet added to GitHub Actions
- [ ] Architecture diagram (mandatory submission deliverable)
- [ ] 4-minute demo video (mandatory submission deliverable)

---

## DEMO STRATEGY — PIVOT (March 7, 2026)

> **Why we pivoted:** ElevenLabs trial expired. Pre-generated FMV pipeline requires 50 clips, video player, synchronized audio — not possible in 4 days. New strategy is faster, cheaper, and actually better for contest judges.

| Change | Old Plan | New Plan |
|---|---|---|
| **Voice output** | ElevenLabs TTS | Gemini Live native `voiceConfig` (Fenrir for Jason, Aoede for Audrey echo) |
| **Scene visuals** | Pre-generated FMV clip library (30–50 clips) | Imagen 3 live generation per `scene_key` trigger |
| **Jason’s POV** | Cracked smart-glasses HUD overlay (requires frontend) | CSS vignette + grain + glitch (implemented in myceliainteractive) |
| **Active characters** | Jason + Audrey + Josh (3 full agents) | Jason (primary) + Audrey (echo background only) |
| **Deferred** | — | Backpack, glasses filters, Josh, Lyria 3, ADK/AutoFlow, FMV pipeline |

**4-day execution plan:**
- Day 1 (Mar 7): All docs revised → end-to-end audio loop validated
- Day 2 (Mar 8): Jason’s demo prompt injected + Imagen 3 scene generation wired
- Day 3 (Mar 9): Frontend WebSocket client + mic capture + Imagen 3 background display
- Day 4 (Mar 10): GM webcam loop live + trust routing + demo polish
- Day 5 (Mar 11): Demo video + submission prep

---

**`liminal-sin-gemini` is a pure backend repo. Zero frontend code lives here.**
- All UI, game wrappers, and marketing live in `myceliainteractive` (Cloudflare Pages)
- `app/`, `components/`, Next.js, React, Tailwind, framer-motion, etc. are ALL deleted
- 315 frontend npm packages removed
- Remaining deps: `express`, `ws`, `firebase-admin`, `@google/genai`, `dotenv`

---

## Environment Variables (`.env.local` — never committed)

```
GOOGLE_CLOUD_PROJECT=project-c4c3ba57-5165-4e24-89e
GOOGLE_CLOUD_REGION=us-west1
NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-c4c3ba57-5165-4e24-89e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase Console>
PORT=3001
```

> No `GEMINI_API_KEY` — Vertex AI mode uses ADC exclusively.

---

## Next Priority Actions (next session start)

**IMMEDIATE — Diagnose local server startup failure**
```powershell
# Step 1: see actual TypeScript error
npx tsc --noEmit 2>&1
# Step 2: if no TS error, try transpile-only
npx ts-node --transpile-only server/server.ts 2>&1
```

**Step B — Imagen 4 Scene Generation**
- On GM `triggerSceneChange` function call → call `imagen-4.0-generate-001` with first-person POV prompt
- Broadcast result as `{ type: 'scene_image', data: base64 }` WebSocket message
- Read `docs/Tunnel-and-park.md` zone definitions before writing any prompts

**Step C — Frontend `scene_image` rendering** (myceliainteractive repo)
- Receive `scene_image` WS event → set as CSS `background-image` on game container div

**Step D — GM Vision Loop**
- Accept `player_frame` WebSocket message (base64 JPEG from frontend webcam)
- Pipe to `liveManager.sendFrame()` at 1 FPS
- Unlocks 40% Innovation scoring criterion

---

## Marketing Shell Status (myceliainteractive repo)
- Landing page `myceliainteractive.com/ls` — LIVE
- Judge backdoor `myceliainteractive.com/ls/judges` — LIVE
- **Game wrapper `myceliainteractive.com/ls/game` — LIVE**
- **Judge game wrapper `myceliainteractive.com/ls/judges/game` — LIVE**
- D1 database `liminal-sin-signups` — provisioned
- Cloudflare Worker signup API — LIVE
- Brevo email system (Email 1 on signup, Email 2 on game-live flag) — LIVE
- `BREVO_API_KEY` and `ADMIN_TOKEN` stored as encrypted Cloudflare secrets
- Frontend and backend being developed in parallel

---

## Character Agents — Quick Reference

| Character | Model | Voice | Demo Status |
|---|---|---|---|
| Jason | `gemini-2.0-flash-live-preview-04-09` | `Fenrir` (Gemini Live native) | ✅ PRIMARY AGENT |
| Audrey | `gemini-2.0-flash-live-preview-04-09` | `Aoede` (Gemini Live native) | 🟡 ECHO BACKGROUND ONLY |
| Josh | `gemini-2.0-flash-live-preview-04-09` | — | ⛔ DEFERRED TO ROADMAP |
| Slotsky | N/A (probability engine) | None | ✅ ACTIVE (CSS/WS events) |
| Game Master | `gemini-2.0-flash-live-preview-04-09` | None | ✅ ACTIVE (bimodal: webcam + mic) |

---

## Firestore Session State Shape

```json
{
  "sessionId": "<uuid>",
  "trustLevel": "Neutral",
  "playerEmotion": "calm",
  "fourthWallCount": 0,
  "sceneKey": "",
  "createdAt": 0,
  "updatedAt": 0
}
```

---

## Competition Status (as of March 6, 2026)
- 7,126 participants in contest
- No FMV horror + Gemini Live voice-narrative competitors found
- **Liminal Sin has a clear, uncontested lane (as far as we know)**

---

## Recent Commits
| Hash | Message |
|---|---|
| `bf11a07` | feat: Jason demo prompt v2 + opening monologue + deploy fix |
| `3f01276` | docs: update CURRENT_STATE.md |
| `45b6ad8` | chore: strip all frontend deps and configs — 315 packages removed |
| `09668fc` | chore: remove frontend artifacts — backend only |
| `7f024fc` | feat: game master overseer engine — tools, function call handler, event broadcast |
| `ae40793` | feat: Vertex AI ADC mode, Firestore connected, port 3001 |


---

## Active Project Identity

| Field | Value |
|---|---|
| **Project** | Liminal Sin — FMV psychological horror experience |
| **Contest** | Gemini Live Agent Challenge (Google / Devpost) |
| **Deadline** | March 16, 2026 @ 5:00 PM PT |
| **Days Remaining** | ~10 |
| **Repo** | `d:\DEV\liminal-sin-gemini` |
| **Marketing Shell** | `myceliainteractive.com/ls` (separate repo: `myceliainteractive`) |
| **Judge Backdoor URL** | `myceliainteractive.com/ls/judges` (see `myceliainteractive` repo) |

---

## March 5, 2026 — Session Summary

### Marketing Shell (myceliainteractive repo) — IN PROGRESS
- Landing page `myceliainteractive.com/ls` live with all sections: navbar, hero, lore, Trust System cards, What Awaits You, signup forms, footer
- Judge backdoor `myceliainteractive.com/ls/judges` live
- D1 database `liminal-sin-signups` provisioned with `signups` table (name, email, type, created_at, email1_sent, email2_sent) + `settings` table (game_live flag)
- Cloudflare Worker (`workers/signup-api.ts`) handling `POST /api/signup`, `POST /api/set-game-live` (Bearer token protected), and cron every minute for Email 2
- **Email system**: Brevo transactional API (free tier, 300/day). Email 1 fires instantly on signup. Email 2 fires when admin calls `/api/set-game-live`
- `BREVO_API_KEY` and `ADMIN_TOKEN` stored as encrypted Cloudflare secrets
- `npm run deploy` script chains `next build && wrangler deploy` — prevents stale asset deploys
- `.gitignore` updated with `*.tsbuildinfo`
- `AGENTS.md` + `copilot-instructions.md` updated: always `npm run build` before deploy rule added

### Known Pending (marketing shell)
- [X] Test and confirm Email 1 delivers to `[redacted]@email.com` via Brevo (pending as of session end)

---

## Current Build Phase

**Phase 1 — Foundation (Days 1–7)** — DOCUMENTS COMPLETE, IMPLEMENTATION NOT YET STARTED

The project is fully designed at the document level. No game code has been implemented yet.

### What Exists (Completed)
- [x] `AGENTS.md` — project rules and execution protocol
- [x] `README.md` — full technical architecture spec, cloud setup playbook, agent prompts
- [x] `docs/WORLD_BIBLE.md` — canonical lore, world layers, character canon
- [x] `docs/Characters.md` — agent persona and system prompt specs
- [x] `docs/Gamemaster.md` — Director agent operational logic
- [x] `docs/Ballys.md` — real-world location context
- [x] `docs/Tunnel-and-park.md` — environment and lighting specs
- [x] `docs/CONTEST.md` — contest constants, scoring matrix, submission checklist
- [x] `CURRENT_STATE.md` — this file
- [x] `package.json` — dependencies installed (Next.js 16, Firebase, Gemini SDK, zustand, etc.)
- [x] `components/CrackedGlassesHud.tsx` — HUD component (built, not yet integrated)
- [x] `app/page.tsx` — Next.js default route (placeholder only)
- [x] `app/globals.css` — Tailwind v4 base styles

### What Does NOT Exist Yet
- [ ] Google Cloud project provisioned (`myceliainteractive` project ID)
- [ ] Firestore database created and structured
- [ ] Cloud Run service (`liminal-gateway`) deployed
- [ ] Gemini Live API integration (voice input → character agents)
- [ ] Director Agent logic (Game Master webcam perception, Anomalous Intensity)
- [ ] Character Agent prompts wired to ADK / Gemini sessions
- [ ] FMV playback pipeline (Cloud Storage clips + scene_key switching)
- [ ] Slotsky engine (trust/fear thresholds → anomaly events)
- [ ] Player webcam/mic capture (`react-webcam` integration)
- [ ] Trust/Fear Firestore state persistence
- [ ] Any actual gameplay loop

---

## Environment Variables Required
All stored in `.env.local` (never committed):

```
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=myceliainteractive
GOOGLE_CLOUD_REGION=us-west1
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Next Priority Action

**Priority 1 — Cloud Foundation (BLOCKING everything)**
> Nothing can be tested without a live Firestore + Gemini Live API connection.

1. Create / select GCP project ID `myceliainteractive`
2. Enable APIs: Vertex AI, Cloud Run, Firestore, Cloud Build, Secret Manager, Cloud Storage
3. Create Firestore database in Native mode (`us-west1`)
4. Add `GEMINI_API_KEY` to `.env.local` (get from Google AI Studio / Google Cloud Console)
5. Add Firebase config values to `.env.local` (Firebase Console → Project Settings → Web App)
6. Run `npm run dev` and confirm local dev server starts with no errors

**Priority 2 — GameMaster Gateway (Cloud Run service)**
> See `README.md` Section ☁️ Cloud System Setup → Step D

**Priority 3 — Jason Character Agent (first playable moment)**
> Wire one character (Jason) to Gemini Live API with voice input + trust/fear state write to Firestore

---

## Character Agents — Quick Reference

| Character | Model | Starting State | Trust Default |
|---|---|---|---|
| Jason | `gemini-2.5-flash-preview-tts` | Separated, POV via cracked smart glasses | Neutral (0.1) |
| Audrey | `gemini-2.5-flash-preview-09-2025` | Separated, voice-only echo | Neutral (0.3) |
| Josh | `gemini-2.5-flash-preview-09-2025` | Separated, voice-only echo | Neutral (0.2) |
| Slotsky | N/A (probability engine) | Environmental only — never speaks | N/A |
| Game Master | `gemini-3.1-pro-preview-09-2025` | Bimodal: webcam 1FPS + audio | N/A |

---

## Firestore Session State Shape

```json
{
  "player_emotion": "calm",
  "player_tone": "steady",
  "player_whisper": false,
  "fourth_wall_count": 0,
  "reality_fractured": false,
  "scene_key": "jason_entry_loop",
  "slotsky_trigger": null,
  "characters": {
    "jason": { "trust_level": 0.1, "fear_index": 0.3, "proximity_state": "FOUND" },
    "audrey": { "trust_level": 0.3, "fear_index": 0.4, "proximity_state": "ECHO" },
    "josh": { "trust_level": 0.2, "fear_index": 0.5, "proximity_state": "ECHO" }
  }
}
```

---

## Competition Status (as of March 4, 2026)
- 6,462 participants in contest
- Project gallery NOT YET PUBLISHED by organizers — no competitor submissions visible
- No FMV horror + Gemini Live voice-narrative projects found anywhere (Reddit, Devpost search, YouTube)
- **Liminal Sin has a clear, uncontested lane in the contest**

---

## Known IP Notes
- "Bally's" references in docs refer to Bally's Las Vegas (rebranded to Horseshoe Las Vegas, Dec 2022)
- Fictional framing is covered by disclaimer in `README.md` — see Attribution & Legal section
- "The Boring Company" is similarly covered by same disclaimer
- No action required on either name — fiction/parody framing + explicit disclaimer = adequate protection
