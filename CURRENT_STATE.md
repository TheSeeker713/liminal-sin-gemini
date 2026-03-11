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
- **FE-1–FE-6**: All frontend steps complete in `myceliainteractive` repo — DONE

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
| **FE-7** ⚠️ | Remove `invert(1)` + `contrast(3)` from `high` glitch CSS keyframe | **DO FIRST** — seizure risk |
| **FE-8** | Radial-gradient flashlight POV vignette `::after` overlay on scene container | Fades out on generator beat |
| **FE-9** | 300ms `vhs-swap` CSS class on video→image swap (`timeupdate`, no `invert`) | Safe transition effect |
| **FE-10** | Card collectible overlay on `anomaly_cards`; sends `card_collected` WS on click | Queen of Spades, lower-right |
| **FE-11** | `zone_merge`/`zone_park_shore` → brightness flicker + flashlight fade + warm tint | Generator lights-on |
| **FE-12** | `agent_speech` with `agent === 'audrey'` → ConvolverNode reverb + DelayNode 0.15s | Depends on B12 |

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

