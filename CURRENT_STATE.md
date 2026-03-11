# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **AI WORKING MEMORY** — Source of truth for backend state.
> Last updated: March 10, 2026 — **B13 + B14 landed: Jason vocalization performance upgrade + jasonReadyForPlayer player input gate.**

---

## ⚠️ READ BEFORE TOUCHING CODE

1. Read `AGENTS.md` + all mandatory docs in Section 9 first.
2. Backend-only repo (Cloud Run). Frontend lives in `myceliainteractive`.
3. **The GM is SILENT** — function calls only. Never speaks to the player.
4. No `GEMINI_API_KEY` — Vertex AI ADC exclusively.

---

## Status: COMPLETE ✓

No remaining backend work before the March 11 cutoff.

### All Completed Work (A → B12 + Bug Fixes)

- **A–J**: Server skeleton, WS transport, mic pipeline, Jason dialogue, audio layers, barge-in, GCS migration
- **B1–B3**: Veo 3.1 Fast (`veo.ts`, `triggerVideoGen`, gameMaster wiring)
- **B4**: GCS verified — 87 SFX, 10 images, 4 voice_overs at `gs://liminal-sin-assets`
- **B5**: All 8 GM tools tested via `POST /debug/fire-gm-event`
- **B6**: Tool ACK hang fix, missing jasonManager arg, trust float mapping
- **B7**: `POST /log-client-error` → Firestore `client_error_logs`
- **B8**: Jason gated behind `intro_complete`
- **B9**: Imagen pre-warm cache — 3 zones on `intro_complete`; cleared on WS close
- **B10**: GM 6-beat strict playbook in `getGameMasterSystemPrompt()`
- **B11**: 45s flashlight hint timer — `{ type: 'hint', text: '...' }` if no scene change
- **B12**: Audrey NPC — Aoede voice, trust-adaptive single echo at beat 6
- **B13**: Jason `VOCALIZATIONS` clause — model now performs grunts, exhales, groans, gasps as authentic non-verbal audio before any speech. `AMBIENT FILTER` clause added — Jason ignores environmental sounds (drip/wind/echo); only responds to direct human speech.
- **B14**: `jasonReadyForPlayer` gate — all `player_speech` is silently dropped for 18s after `intro_complete`. After 18s: gate opens + `{ type: 'player_speak_prompt' }` sent to frontend to trigger the "speak to JASON" hint. Prevents ambient mic bleed and premature Jason responses during the landing monologue. `jasonReadyTimer` cleared on WS close.

### March 10 Bug Fixes (commit `720fb87` + input gate follow-up)

- **GM model**: GM now uses `gemini-2.0-flash-live-001` with `responseModalities: [TEXT]`. Was incorrectly sharing `gemini-live-2.5-flash-native-audio` (NPC-only model), causing 1007 crash on connect and premature Beat 2 scene change before player speaks.
- **Strobe/glitch spam**: `triggerGlitchEvent` now throttled at 3s cooldown per session via `lastGlitchMs` map. `clearGlitchThrottle()` called on WS close.
- **`fourthWallCount` never persisted**: Added `updateFourthWallCount()` in `db.ts` (atomic `FieldValue.increment`). Called in `triggerSlotsky` on `fourth_wall_correction`.
- **GM output gate**: `triggerSceneChange` and `triggerVideoGen` blocked (ACK'd + dropped) until `gmGated = true` on `intro_complete`.
- **GM input gate**: `gmManager.sendAudio()` and `gmManager.sendFrame()` both now guarded by `if (gmGated)` — GM receives no player audio or webcam frames during the 11.5s cinematic.

### Frontend (cross-ref only)

FE-1–FE-12 all done in `myceliainteractive`. Feature-locked. No further FE work before March 11.

---

## WS Event Contract

| Event | Direction | Payload |
|-------|-----------|---------|
| `intro_complete` | FE → BE | `{}` |
| `player_speech` | FE → BE | `{ audio: base64 }` |
| `player_frame` | FE → BE | `{ jpeg: base64 }` |
| `session_ready` | BE → FE | `{ session_id: string }` |
| `agent_speech` | BE → FE | `{ agent: 'jason'\|'audrey', audio: base64 }` |
| `agent_interrupt` | BE → FE | `{ agent: 'jason' }` |
| `trust_update` | BE → FE | `{ trust_level: number, fear_index: number }` |
| `hud_glitch` | BE → FE | `{ intensity: string, duration_ms: number }` |
| `scene_change` | BE → FE | `{ payload: { sceneKey: string } }` |
| `scene_image` | BE → FE | `{ payload: { sceneKey, data: base64 } }` |
| `scene_video` | BE → FE | `{ payload: { sceneKey, url: string } }` |
| `slotsky_trigger` | BE → FE | `{ payload: { anomalyType: string } }` |
| `hint` | BE → FE | `{ text: string }` |
| `player_speak_prompt` | BE → FE | `{}` — fires 18s after `intro_complete`; FE shows "speak to JASON" hint |
| `audience_update` | BE → FE | `{ payload: { personCount, groupDynamic, observedEmotions } }` |

---

## File Map

| File | Purpose |
|------|---------|
| `server/server.ts` | Express + WS server, PORT 3001 / 8080 Cloud Run |
| `server/types/state.ts` | PlayerSession, GmEvent types |
| `server/services/db.ts` | Firestore ADC + in-memory fallback |
| `server/services/gemini.ts` | Vertex AI Live client, GM tools, `LiveSessionManager` |
| `server/services/gameMaster.ts` | GM function call router — Firestore + WS broadcast |
| `server/services/imagen.ts` | Imagen 4 scene generation |
| `server/services/veo.ts` | Veo 3.1 Fast img2vid |
| `server/services/npc/jason.ts` | Jason system prompt — trust + fear floats injected at session start |
| `server/services/npc/audrey.ts` | Audrey echo NPC — Aoede voice, trust-adaptive, single echo per session |

---

## Infrastructure

| Resource | Value |
|----------|-------|
| GCP Project | `project-c4c3ba57-5165-4e24-89e` |
| Cloud Run | `https://liminal-sin-server-1071754889104.us-west1.run.app` |
| GCS Bucket | `gs://liminal-sin-assets` |
| Firestore | Native mode, `us-west1` |
| NPC Gemini Live Model | `gemini-live-2.5-flash-native-audio` (Jason + Audrey) |
| GM Gemini Live Model | `gemini-2.0-flash-live-001` (Game Master — function calls only) |
| Gemini Live Region | `us-central1` (required) |
| Auth | ADC — no API key |

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

