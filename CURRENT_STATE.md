# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **AI WORKING MEMORY** — Source of truth for backend state.
> Last updated: March 10, 2026 — **Backend sprint COMPLETE. B9–B12 all done. Unblocks FE-11, FE-12.**

---

## ⚠️ READ BEFORE TOUCHING CODE

1. Read `AGENTS.md` + all mandatory docs in Section 9 first.
2. Backend-only repo (Cloud Run). Frontend lives in `myceliainteractive`.
3. **The GM is SILENT** — function calls only. Never speaks to the player.
4. No `GEMINI_API_KEY` — Vertex AI ADC exclusively.

---

## Completed (Summary)

- **Steps A–J**: Server, WS, mic, Jason dialogue, audio layers, barge-in, GCS migration — DONE
- **B1–B3**: Veo 3.1 Fast pipeline (`veo.ts` + `triggerVideoGen` GM tool + gameMaster wiring) — DONE
- **B4**: GCS verified — 87 SFX, 10 images, 4 voice_overs at `gs://liminal-sin-assets` — DONE
- **B5**: All 8 GM tools battle-tested via `POST /debug/fire-gm-event` — DONE
- **B6**: 4 bugs fixed (GM model crash, tool ACK hang, missing jasonManager arg, trust float fail) — DONE
- **B7**: `POST /log-client-error` → Firestore `client_error_logs` — DONE
- **B8**: Jason silent until `intro_complete` WS fires — DONE
- **B9**: Imagen pre-load cache — 3 zones pre-warmed on `intro_complete`; cache hit/miss path in `triggerSceneChange`; cleared on WS close — DONE
- **B10**: GM 6-beat strict playbook baked into `getGameMasterSystemPrompt()` — DONE
- **B11**: 45s flashlight hint timer — `{ type: 'hint', text: '...' }` WS event fires if no scene change in 45s — DONE
- **B12**: Audrey NPC live — Aoede voice, trust-adaptive echo, fires once at beat 6; `audrey_echo` scene_change broadcast — DONE
- **FE-1–FE-12**: All frontend sprint work complete in `myceliainteractive` repo as of March 10, 2026. FE-7–FE-12 implemented: seizure-safe glitch CSS, flashlight POV vignette, VHS swap transition, card collectible UI, generator lights-on transition, Audrey echo audio pipeline. `GameHUD.tsx` and `GameWSContext.tsx` fully wired. 0 TS errors, 0 ESLint warnings. **Frontend is feature-locked — no further FE work before the March 11 cutoff.**

---

## March 10 Sprint — COMPLETE ✓

All B9–B12 backend steps done and pushed to main (`51b56f7`). No remaining backend work before the March 11 cutoff. Frontend unblocked for FE-11 and FE-12.

---

## New WS Events This Sprint

| Event | Direction | Payload | Status |
|-------|-----------|---------|--------|
| `intro_complete` | FE → BE | `{}` | DONE |
| `hint` | BE → FE | `{ type: 'hint', text: string }` | DONE — B11 live |
| `agent_speech` (audrey) | BE → FE | `{ agent: 'audrey', audio: base64 }` | DONE — B12 live |
| `card_collected` | FE → BE | `{ sessionId: string }` | FE-10 — no backend action needed |

---

## Frontend Sprint (FE-7 → FE-12) — Cross-Ref

> Full specs live in `myceliainteractive/CURRENT_STATE.md`. Summary below for cross-repo awareness.

| Step | Feature | Notes |
|------|---------|-------|
| **FE-7** | Remove `invert(1)` + `contrast(3)` from `high` glitch CSS keyframe | ✅ DONE |
| **FE-8** | Radial-gradient flashlight POV vignette `::after` overlay on scene container | ✅ DONE |
| **FE-9** | 300ms `vhs-swap` CSS class on video→image swap (`timeupdate`, no `invert`) | ✅ DONE |
| **FE-10** | Card collectible overlay on `anomaly_cards`; sends `card_collected` WS on click | ✅ DONE |
| **FE-11** | `zone_merge`/`zone_park_shore` → brightness flicker + flashlight fade + warm tint | ✅ DONE |
| **FE-12** | `agent_speech` with `agent === 'audrey'` → ConvolverNode reverb + DelayNode 0.15s | ✅ DONE |

---

## File Map

| File | Purpose |
|------|---------|
| `server/server.ts` | Express + WS server, PORT 3001 / 8080 Cloud Run |
| `server/types/state.ts` | TrustLevel, PlayerEmotion, PlayerSession, GmEvent types |
| `server/services/db.ts` | Firestore ADC client, in-memory fallback for local dev |
| `server/services/gemini.ts` | Vertex AI Live client, GM tool declarations, `LiveSessionManager` |
| `server/services/gameMaster.ts` | GM function call router — Firestore + WS broadcast |
| `server/services/imagen.ts` | Imagen 4 scene generation — 7 zone prompts, returns base64 JPEG |
| `server/services/veo.ts` | Veo 3.1 Fast img2vid — zone animation hints, polls op, returns GCS URI |
| `server/services/npc/jason.ts` | Jason system prompt v2 — trust + fear floats injected at session start |
| `server/services/npc/audrey.ts` | Audrey echo NPC — Aoede voice, trust-adaptive (≥0.7 hopeful / <0.4 panicked), single echo per session |

---

## Infrastructure

| Resource | Value |
|----------|-------|
| GCP Project | `project-c4c3ba57-5165-4e24-89e` |
| Cloud Run | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| GCS Bucket | `gs://liminal-sin-assets` / `https://storage.googleapis.com/liminal-sin-assets/` |
| Firestore | Native mode, `us-west1` |
| Gemini Live Model | `gemini-live-2.5-flash-native-audio` |
| Gemini Live Region | `us-central1` (required) |
| Auth | ADC — no API key needed locally or on Cloud Run |

**Local dev:**
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
npx tsx server/server.ts
```

**`.env.local` (never committed):**
```
GOOGLE_CLOUD_PROJECT=project-c4c3ba57-5165-4e24-89e
GOOGLE_CLOUD_REGION=us-west1
JASON_VOICE=Enceladus
PORT=3001
```

---

## Deadlines

| Date | Milestone |
|------|-----------|
| **March 11 @ 11:11 PM MT** | Internal prototype cutoff — full demo functional |
| **March 16 @ 5:00 PM PDT** | HARD DEADLINE — contest submission |

---

## ⚠️ BUG FIX REQUIRED — March 10, 2026

Three bugs were found in a post feature-lock diagnostic. Two are frontend-only and have been fixed in `myceliainteractive`. **One requires a backend fix in this repo.**

---

### Backend Bug: GM Not Gated Behind `intro_complete` — Fires Events During Cinematic

**Severity: Critical**

**What's happening:**
- `session_start` arrives → all three Gemini sessions (Jason, GM, Audrey) connect immediately  
- `session_ready` is sent back to the frontend within ~1–2s
- The GM session begins receiving `player_frame` webcam events immediately (every 1s from frontend)
- The GM evaluates the player's face and room and starts calling tools: `triggerHudGlitch`, `triggerSlotskyAnomaly`, etc.
- These events arrive at the frontend **while the 11.5s cinematic intro is still playing**
- The player sees `hud_glitch` flashes and hears SFX mid-cinematic, breaking immersion and the narrative flow

**Root cause:**
`intro_complete` is correctly used to gate Jason (B8 is working). But the GM's `player_frame` pipeline has **no equivalent gate**. The relevant code is in `server/server.ts`:

```typescript
// Player webcam frame — base64 JPEG from browser → Game Master (1 FPS, GM vision)
if (data.type === 'player_frame' && data.jpeg) {
  gmManager.sendFrame(data.jpeg);   // ← NO GATE — fires immediately
  return;
}
```

**Required fix (server/server.ts):**

Add a `gmIntroComplete` flag alongside the existing `jasonIntroFired` flag:

```typescript
let gmIntroComplete = false;  // Gates GM from processing frames until intro_complete
```

Then in the `intro_complete` handler, set it:

```typescript
if (data.type === 'intro_complete' && !jasonIntroFired) {
  jasonIntroFired = true;
  gmIntroComplete = true;   // ← ADD THIS — unlock GM processing
  // ... rest of existing handler unchanged ...
}
```

Then gate `player_frame` forwarding:

```typescript
if (data.type === 'player_frame' && data.jpeg) {
  if (gmIntroComplete) {    // ← ADD THIS GUARD
    gmManager.sendFrame(data.jpeg);
  }
  return;
}
```

Optionally (recommended) also gate `player_speech` to GM during intro — Jason shouldn't hear player until intro ends either:

```typescript
if (data.type === 'player_speech' && data.audio) {
  jasonManager.sendAudio(data.audio);
  if (gmIntroComplete) {    // ← ADD THIS GUARD
    gmManager.sendAudio(data.audio);
  }
  return;
}
```

**Expected result after fix:**
- Cinematic plays cleanly for ~11.5s — no GM events, no glitch flashes, no SFX
- At 11.5s: frontend sends `intro_complete`
- Jason fires his landing sequence
- GM begins receiving frames and evaluating the player
- Game events start flowing in correct narrative order

**Files to touch:** `server/server.ts` only (2 flag additions + 2 guards)  
**Cross-repo note:** Frontend side is already fixed — `intro_complete` is now sent correctly from `IntroSequence.tsx`. No further frontend changes needed.

