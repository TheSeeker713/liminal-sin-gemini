# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> **AI WORKING MEMORY** — Source of truth for backend state.
> Last updated: March 10, 2026 — **Backend sprint B9–B12 COMPLETE. No remaining backend work.**

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
- **B5–B6**: All 8 GM tools battle-tested; 4 critical bugs fixed (GM model crash, tool ACK hang, trust float fail) — DONE
- **B7**: `POST /log-client-error` → Firestore `client_error_logs` — DONE
- **B8**: Jason silent until `intro_complete` WS fires; landing sequence triggered on cue — DONE
- **B9**: Imagen 4 pre-warm cache (`zone_tunnel_entry`, `zone_merge`, `zone_park_shore`) fires on `intro_complete`; `triggerSceneChange` serves cache hit instantly, falls back to live generation on miss — DONE
- **B10**: GM prompt replaced with strict 6-beat scripted playbook (Darkness → Flashlight → Generator → Waterpark → Card Anomaly → Audrey Echo). `found_transition` is a one-way door. Trust eval in beat 1 only — DONE
- **B11**: 45-second flashlight hint timer fires `{ type: 'hint', text: 'ask him if he has a flashlight' }` if GM fires no scene change after `intro_complete` — DONE
- **B12**: Audrey NPC (`Aoede` voice) connected at session start; `triggerAudreyVoice` GM tool fires trust-adaptive one-shot prompt (≥0.7 hopeful / <0.4 frightened); broadcasts `scene_change { sceneKey: 'audrey_echo' }` + `agent_speech { agent: 'audrey' }` — DONE

---

## WS Event Reference (All Complete)

| Event | Direction | Payload |
|-------|-----------|---------|
| `session_ready` | BE → FE | `{ session_id: string }` |
| `intro_complete` | FE → BE | `{}` |
| `agent_speech` | BE → FE | `{ agent: 'jason' \| 'audrey', audio: base64 }` |
| `agent_interrupt` | BE → FE | `{ agent: 'jason' }` |
| `trust_update` | BE → FE | `{ trust_level: float, fear_index: float }` |
| `hud_glitch` | BE → FE | `{ intensity: 'low'\|'medium'\|'high', duration_ms: number }` |
| `scene_change` | BE → FE | `{ sceneKey: string }` |
| `scene_image` | BE → FE | `{ sceneKey: string, data: base64JPEG }` |
| `scene_video` | BE → FE | `{ sceneKey: string, url: gcsUri }` |
| `slotsky_trigger` | BE → FE | `{ anomalyType: string }` |
| `audience_update` | BE → FE | `{ personCount, groupDynamic, observedEmotions }` |
| `hint` | BE → FE | `{ text: string }` |
| `card_collected` | FE → BE | `{ sessionId: string }` — informational only, no backend action |
| `player_speech` | FE → BE | `{ audio: base64PCM }` |
| `player_frame` | FE → BE | `{ jpeg: base64JPEG }` |
| `player_text` | FE → BE | `{ text: string }` — test/debug only |

---

## Frontend Unblocked — Action Required in `myceliainteractive`

> Backend is fully complete as of March 10, 2026. All WS events are live.
> The following frontend steps are now unblocked and pending implementation.

| Step | Feature | Backend Dependency |
|------|---------|-------------------|
| **FE-7** ⚠️ | Remove `invert(1)` + `contrast(3)` from `high` glitch CSS keyframe | **DO FIRST** — seizure risk |
| **FE-8** | Radial-gradient flashlight POV vignette overlay; fades out on generator beat | None |
| **FE-9** | 300ms `vhs-swap` CSS transition on video→image swap | None |
| **FE-10** | Card collectible overlay on `anomaly_cards`; sends `card_collected` WS on click | `slotsky_trigger { anomalyType: 'anomaly_cards' }` ✅ |
| **FE-11** | `zone_merge` / `zone_park_shore` → brightness flicker + flashlight fade + warm tint | `scene_change` ✅ |
| **FE-12** | `agent_speech { agent: 'audrey' }` → ConvolverNode reverb + DelayNode 0.15s echo effect | `agent_speech (audrey)` ✅ B12 DONE |

---

## File Map

| File | Purpose |
|------|---------|
| `server/server.ts` | Express + WS server, PORT 3001 / 8080 Cloud Run |
| `server/types/state.ts` | PlayerEmotion, PlayerSession, GmEvent types |
| `server/services/db.ts` | Firestore ADC client, in-memory fallback for local dev |
| `server/services/gemini.ts` | Vertex AI Live client, 8 GM tool declarations, `LiveSessionManager` |
| `server/services/gameMaster.ts` | GM function call router — Firestore + WS broadcast |
| `server/services/imagen.ts` | Imagen 4 scene generation + pre-warm cache — 7 zone prompts |
| `server/services/veo.ts` | Veo 3.1 Fast img2vid — zone animation hints, polls op, returns GCS URI |
| `server/services/npc/jason.ts` | Jason system prompt — trust + fear floats injected at session start |
| `server/services/npc/audrey.ts` | Audrey echo NPC — Aoede voice, trust-gated single echo |

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

