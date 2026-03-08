# BACKEND_CLOUD.md — Liminal Sin Backend Architecture
## Cloud Infrastructure, Agent System & API Contract
### Version 1.1 | March 7, 2026
### Cross-reference: WORLD_BIBLE.md | AGENTS.md | TEAM_CONTRACT.md

---

## 1. Overview

The `liminal-sin-gemini` repo is the **backend brain** of the Liminal Sin project. It owns:
- All AI agent logic (Game Master, Jason, Audrey, Josh, Slotsky)
- The real-time WebSocket server that the game UI connects to
- Google Cloud infrastructure (Cloud Run, Firestore, Vertex AI Memory)
- The Gemini Live API bidirectional audio pipeline

The frontend (`myceliainteractive`) is a **dumb terminal** — it sends player input and renders what this backend sends back. All trust logic, agent behavior, and state live here.

---

## 2. Infrastructure Stack

| Component | Service | Purpose |
|---|---|---|
| **Backend host** | Google Cloud Run | Containerized Node.js/Python proxy server |
<!-- DEPRECATED BLOCK: ADK and Vertex AI Memory Bank are NOT used per AGENTS.md rules.
| **Agent orchestration** | Google Agent Development Kit (ADK) | AutoFlow multi-agent delegation |
| **AI models** | Gemini Live API (via ADK) | Real-time bidirectional voice + vision |
| **State store (short-term)** | `session.state` / Firestore | Per-session trust, fear, proximity |
| **State store (long-term)** | Vertex AI Memory Bank | Cross-scene persistent character memory |
-->
| **Agent orchestration** | Custom WebSocket Server | WebSockets routing to Google GenAI SDK |
| **AI models** | Gemini Live API (@google/genai) | Real-time bidirectional voice + vision |
| **State store** | Firestore | Per-session trust, fear, proximity |
| **Game Master vision** | Webcam JPEG @ 1 FPS | Emotion classification written to Firestore |
| **CI/CD** | GitHub Actions → Cloud Run | On push to `main` |

---

## 3. Agent Hierarchy

```
┌─────────────────────────────────────────────┐
│           GAME MASTER (Overseer)            │
│  Gemini 3.1 Pro — Webcam (1fps) + Mic       │
│  Reads all Firestore state                  │
│  Controls pacing, dread escalation, glitch  │
└──────────┬──────────────────────────────────┘
           │ Custom WebSocket message routing
    ┌──────┴────────────────────────────────┐
    │               │               │       │
 JASON           AUDREY           JOSH   SLOTSKY
 Flash Native   Flash Native   Flash   (State writer)
 Audio           Audio (echo)  Audio   Reads session.state
 Trust/Fear      Trust/Fear   Trust/  Writes game events
 tracked         tracked      Fear    No direct voice
```

### Firestore State Per Character
```json
{
  "trust_level": 0.0,
  "fear_index": 0.0,
  "proximity_state": "ISOLATED",
  "fourth_wall_count": 0,
  "last_exchange": "",
  "private_knowledge_unlocked": false
}
```

---

## 4. WebSocket API Contract

This is the **seam** between this backend and the `myceliainteractive` frontend. Both sides must adhere to this contract. Any change here is a **cross-repo change** — update `TEAM_CONTRACT.md` and notify the frontend.

### Connection
```
wss://<cloud-run-host>/game
```
Environment variable in frontend: `NEXT_PUBLIC_GAME_WS_URL`

### Client → Server Events (Frontend sends)

| Event | Payload | Description |
|---|---|---|
| `session_start` | `{ judge_mode: boolean }` | Player opens game, initializes session |
| `player_speech` | `{ audio: base64, timestamp: number }` | PCM 16-bit/16kHz audio chunk |
| `player_frame` | `{ jpeg: base64, timestamp: number }` | 1 FPS webcam JPEG for Game Master |
| `session_end` | `{}` | Player closes game / navigates away |

### Server → Client Events (Backend sends)

| Event | Payload | Description |
|---|---|---|
| `agent_speech` | `{ agent: "jason"\|"audrey"\|"josh", audio: base64, text: string }` | Character TTS audio chunk to play |
| `agent_interrupt` | `{ agent: string }` | Stop playing current TTS — player barged in |
| `trust_update` | `{ agent: string, trust_level: number, fear_index: number }` | HUD trust/fear indicator update |
| `fmv_trigger` | `{ sequence_id: string, loop: boolean }` | Play a specific FMV video clip |
| `fmv_stop` | `{}` | Stop current FMV, return to live state |
<!-- [AI: hud_glitch 'cracked glasses glitch effect' deferred — no cracked screen effect in contest build. Semi-transparent CSS overlay used instead. Event preserved for post-contest restoration. Original: `hud_glitch` | `{ intensity: "low"|"med"|"high", duration_ms: number }` | Trigger cracked glasses glitch effect] -->
| `hud_glitch` | `{ intensity: "low"\|"med"\|"high", duration_ms: number }` | Trigger smart glasses visual glitch effect |
| `gm_emotion_update` | `{ player_emotion: string }` | GM detected player emotion (internal, for debug HUD) |
| `session_ready` | `{ session_id: string }` | Session initialized, game can begin |
| `session_error` | `{ code: string, message: string }` | Unrecoverable error |

---

## 5. Mock WebSocket Server (Local Dev)

During frontend development, the backend can be replaced with a mock server so UI work doesn't block on Cloud Run being ready.

### Location
`tools/mock-ws-server.ts` (to be created)

### Behavior
- Accepts all client → server events without error
- Responds with scripted `agent_speech`, `trust_update`, and `fmv_trigger` events on a timer
- Simulates a 30-second "Act 1 Threshold" opening sequence

### Starting the mock
```bash
npx ts-node tools/mock-ws-server.ts
# Listens on ws://localhost:4000/game
```

Frontend `.env.local`:
```
NEXT_PUBLIC_GAME_WS_URL=ws://localhost:4000/game
```

---

## 6. Cloud Run Deployment

### Build & Deploy
```bash
# Build container
docker build -t liminal-sin-backend .

# Deploy to Cloud Run
gcloud run deploy liminal-sin-backend \
  --image gcr.io/<PROJECT_ID>/liminal-sin-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables (Cloud Run Secrets)
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini Live API key |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `FIRESTORE_DATABASE` | Firestore database name |
<!-- DEPRECATED: | `VERTEX_MEMORY_STORE` | Vertex AI Memory Bank ID | -->

---

## 7. Firestore Collections

```
/sessions/{session_id}/
  characters/
    jason    → { trust_level, fear_index, proximity_state, ... }
    audrey   → { trust_level, fear_index, proximity_state, ... }
    josh     → { trust_level, fear_index, proximity_state, ... }
  game/
    state    → { current_layer, game_live, active_fmv, gm_pacing }
  player/
    emotion  → { label, updated_at }
    tone     → { label, updated_at }

/settings/
  game_live  → { value: boolean }  ← admin flag for Email 2 trigger
```

---

## 8. Gemini Live API — Audio Pipeline

- **Input:** PCM 16-bit, 16kHz mono from player mic
- **Output:** PCM audio streamed back, played via Web Audio API in frontend
- **Barge-in:** Native — player speech mid-TTS sends `agent_interrupt` event to frontend, which stops Web Audio playback immediately
- **Vision:** Game Master receives 1 FPS JPEG from player webcam, processed for emotion tags

---

## 9. Local Development

```bash
# Install dependencies
npm install

<!-- DEPRECATED: # Run ADK dev server (exposes mock WebSocket for frontend)
npx adk dev -->
# Run dev server
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npx eslint --fix src/
```

---

## 10. Contest Compliance Checklist

Before submission, verify all of the following are demonstrably active:

- [ ] Gemini Live API — real-time bidirectional voice streaming (Jason, Audrey, Josh)
<!-- DEPRECATED: 
- [ ] Google ADK — AutoFlow multi-agent delegation (GM → characters)
-->
- [ ] Custom WebSocket server for audio routing
- [ ] Google Cloud Run — active deployment, not localhost
- [ ] Cloud Firestore — trust/fear state reads and writes visible in GCP console
<!-- DEPRECATED:
- [ ] Vertex AI Memory Bank — long-term character memory persisting across scenes
-->
- [ ] GCP proof screenshots in `/docs/` for submission
