# TEAM_CONTRACT.md — Liminal Sin: Unified Project Coordination
### Lives in BOTH repos: `myceliainteractive` AND `liminal-sin-gemini`
### Version 1.0 | March 5, 2026
### Status: ACTIVE

> **This file is identical in both repos. If you update it in one, update it in the other.**

---

## 1. We Are One Project

`myceliainteractive` and `liminal-sin-gemini` are two separate repositories that together build **one complete product: Liminal Sin**.

Neither repo is complete on its own. They are permanently coupled at the API contract seam defined in §3 below. Both Copilot instances operating in these repos must understand this at all times.

| Repo | Role | Owns |
|---|---|---|
| **myceliainteractive** | Frontend | Browser UI, marketing shell, game UI shell, Cloudflare deployment |
| **liminal-sin-gemini** | Backend | AI agents, Gemini Live, Cloud Run, Firestore, ADK orchestration |

---

## 2. Responsibility Split

### `myceliainteractive` owns:
- `myceliainteractive.com/ls` — marketing landing page
- `myceliainteractive.com/ls/game` — game UI shell (browser client)
- `myceliainteractive.com/ls/judges` — judge access panel
- Cloudflare Workers for signup API
- Cloudflare D1 database (`liminal-sin-signups`)
- Brevo transactional email
- All visual rendering: FMV playback, HUD overlays, cracked glasses effect, glitch animations
- WebSocket **client** — sends player mic audio and webcam frames, receives agent events

### `liminal-sin-gemini` owns:
- All AI agent logic (Game Master, Jason, Audrey, Josh, Slotsky)
- Gemini Live API bidirectional audio pipeline
- Google Cloud Run backend server
- Cloud Firestore state (trust, fear, proximity, session)
- Vertex AI Memory Bank (long-term character memory)
- Google ADK AutoFlow multi-agent orchestration
- WebSocket **server** — receives player input, sends agent events back

### Neither repo touches the other's domain without explicit cross-repo coordination.

---

## 3. The API Contract (The Seam)

All communication between the two repos flows through a single WebSocket connection:

```
wss://<cloud-run-host>/game
```

Frontend env var: `NEXT_PUBLIC_GAME_WS_URL`

### Client → Server (frontend sends)
| Event | Payload |
|---|---|
| `session_start` | `{ judge_mode: boolean }` |
| `player_speech` | `{ audio: base64, timestamp: number }` |
| `player_frame` | `{ jpeg: base64, timestamp: number }` |
| `session_end` | `{}` |

### Server → Client (backend sends)
| Event | Payload |
|---|---|
| `agent_speech` | `{ agent: string, audio: base64, text: string }` |
| `agent_interrupt` | `{ agent: string }` |
| `trust_update` | `{ agent: string, trust_level: number, fear_index: number }` |
| `fmv_trigger` | `{ sequence_id: string, loop: boolean }` |
| `fmv_stop` | `{}` |
| `hud_glitch` | `{ intensity: string, duration_ms: number }` |
| `session_ready` | `{ session_id: string }` |
| `session_error` | `{ code: string, message: string }` |

### CONTRACT RULE
> **Any change to this event schema is a cross-repo breaking change.** Before modifying event names, payloads, or adding new events: flag it, update this file in BOTH repos, and confirm both sides are updated before deploying either.

---

## 4. AI Tools Boundary

| Tool | Permitted in MI (frontend) | Permitted in LS (backend) |
|---|---|---|
| **Gemini Live API** | ❌ Never — game logic is backend only | ✅ Core requirement |
| **Google ADK** | ❌ | ✅ Core requirement |
| **Google Cloud Run** | ❌ | ✅ Core requirement |
| **Cloud Firestore** | ❌ direct writes | ✅ Source of truth |
| **Cloudflare Workers AI** (Flux, Deepgram, etc.) | ✅ Marketing shell & UI assets only | ❌ |
| **Cloudflare D1** | ✅ Signups only | ❌ |
| **Brevo** | ✅ Transactional email | ❌ |

The game agent logic (trust, fear, character responses) must ALWAYS run on Google Gemini via Cloud Run. This is a **contest compliance requirement** — see `docs/Contest.md` in `liminal-sin-gemini`.

---

## 5. Running Both Repos Simultaneously

### Recommended Setup
```
VS Code Window 1 → myceliainteractive
VS Code Window 2 → liminal-sin-gemini

Terminal 1 (MI):   npm run dev           → http://localhost:3000
Terminal 2 (LS):   npx adk dev           → ws://localhost:4000/game
```

### Frontend Dev Against Mock Backend
When Cloud Run is not ready, the frontend can develop against a local mock WebSocket server:

```bash
# In liminal-sin-gemini:
npx ts-node tools/mock-ws-server.ts   # ws://localhost:4000/game

# In myceliainteractive .env.local:
NEXT_PUBLIC_GAME_WS_URL=ws://localhost:4000/game
```

The mock server returns scripted agent events so the UI can be built without waiting for the real ADK pipeline.

### Frontend Dev Against Real Backend (Staging)
```
NEXT_PUBLIC_GAME_WS_URL=wss://<cloud-run-staging-host>/game
```

### Production
```
NEXT_PUBLIC_GAME_WS_URL=wss://<cloud-run-production-host>/game
```

---

## 6. Deployment Sequence

When deploying a full end-to-end update that affects both repos:

1. Deploy `liminal-sin-gemini` backend first (Cloud Run)
2. Confirm backend WebSocket is live and responding
3. Deploy `myceliainteractive` frontend second (`npm run deploy`)
4. Smoke test: open `/ls/game`, confirm `session_ready` event received

Never deploy frontend against a backend that hasn't been updated — event schema mismatches will break the game silently.

---

## 7. Deadlines

| Milestone | Date |
|---|---|
| Internal prototype-ready | March 11, 2026 |
| Internal completion target | March 15, 2026 EOD |
| Contest deadline (hard) | March 16, 2026 5:00 PM PDT |

Both repos must be submission-ready by March 15. The public GitHub repo for judging is `liminal-sin-gemini` — it must contain the architecture diagram, README, and GCP proof screenshots.

---

## 8. Keeping This File in Sync

This file is mirrored in both repos. When making updates:
```bash
# After editing in one repo, copy to the other:
# Update myceliainteractive/TEAM_CONTRACT.md
# Then copy identical content to liminal-sin-gemini/TEAM_CONTRACT.md
# Commit both
```

Both Copilot instances will read this file and understand they are part of the same build.
