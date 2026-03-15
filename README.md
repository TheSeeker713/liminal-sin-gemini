# **LIMINAL SIN**

> **Note:** This project is a work of fiction. It is designed as a psychological horror experience and is not intended to depict real events or people. All characters, locations, and scenarios are entirely fictional and created for the purpose of storytelling. This project does not sponsor or endorse any real-world entities, products, or services.

**"The House Always Wins. Even in the Unreality."**

A first-person, multi-agent FMV psychological horror prototype built for the **[Gemini Live Agent Challenge](https://ai.google.dev/competition/projects/live-agent-challenge)**. Developed by **Mycelia Interactive** (**J.W. / Jeremy W. Robards** with **A.L. / Adrianna Loya** as creative consultant).

**Live demo:** [myceliainteractive.com/ls/game](https://www.myceliainteractive.com/ls/game/)

**Frontend repo:** [TheSeeker713/myceliainteractive](https://github.com/TheSeeker713/myceliainteractive)

---

## The Vision

**Liminal Sin** is not just a game — it is a live, anomalous event. It leverages the **Gemini Live API** to orchestrate autonomous AI characters who exist within a fractured, shifting reality beneath Las Vegas.

You play as a disembodied presence — a "voice from the static." Communicating through an experimental radio feed, your goal is to guide a group of trapped survivors back to the surface. But the system is designed to test your ethics. An ever-watchful Game Master observes your real-world behavior. If you falter, lie, or panic, the probability engine known only as **Slotsky** will warp their reality in real time.

**Content & Safety Disclosure**: Strictly **psychological horror**. No gore, blood, or physical violence. Tension derives from isolation, spatial disorientation, and emergent NPC behavior. Atmospheric dread and the uncanny valley take precedence over cheap scares.

---

## Live Multi-Agent Architecture

This project runs **4 concurrent Gemini Live API sessions per player** on Google Cloud Run, each with a distinct role:

| Agent | Model | Role | Code |
|---|---|---|---|
| **Jason NPC** | `gemini-live-2.5-flash-native-audio` (Enceladus voice) | Speaks to the player via bidirectional audio. Personality, trust, and fear-reactive. | [`server/services/npc/jason.ts`](server/services/npc/jason.ts) |
| **Audrey NPC** | `gemini-live-2.5-flash-native-audio` (Aoede voice) | Trust-gated echo voice. Goes silent at trust < 0.2. | [`server/services/npc/audrey.ts`](server/services/npc/audrey.ts) |
| **Game Master** | `gemini-live-2.5-flash-native-audio` (TEXT mode) | Silent overseer. Never speaks. Controls world state via function calls only. Triggers scene changes, trust/fear shifts, glitch events, card discoveries, Slotsky anomalies. | [`server/services/gemini.ts`](server/services/gemini.ts) |
| **Keyword Listener** | `gemini-live-2.5-flash` | Dedicated session monitoring player speech for per-step keyword triggers (e.g., "flashlight", "generator", "elevator"). | [`server/services/keywordListener.ts`](server/services/keywordListener.ts) |

Additionally, the backend invokes:
- **Imagen 4** (`imagen-4.0-generate-001`) — live image generation for wildcard events | [`server/services/imagen.ts`](server/services/imagen.ts)
- **Veo 3.1** (`veo-3.1-fast-generate-001`) — live video generation for wildcard events | [`server/services/veo.ts`](server/services/veo.ts)

### Google Cloud Infrastructure

| Service | Purpose | Proof |
|---|---|---|
| **Cloud Run** | Hosts the WebSocket server + all Gemini sessions | [`Dockerfile`](Dockerfile), [`package.json` deploy script](package.json) |
| **Firestore** | Session state (trust, fear, step, cards, audience) | [`server/services/db.ts`](server/services/db.ts) |
| **Google Cloud Storage** | 16 stills + 18 clips served to frontend | [`server/services/gameMaster.ts`](server/services/gameMaster.ts) (GCS base URL) |
| **Vertex AI** | Gemini Live, Imagen 4, Veo 3.1 inference | [`server/services/gemini.ts`](server/services/gemini.ts), [`server/services/imagen.ts`](server/services/imagen.ts), [`server/services/veo.ts`](server/services/veo.ts) |
| **Artifact Registry** | Docker image hosting | [`package.json` docker:push script](package.json) |
| **GitHub Actions** | CI/CD pipeline with Workload Identity Federation | [`.github/workflows/`](.github/workflows/) |

### Key Backend Modules

| File | Purpose |
|---|---|
| [`server/server.ts`](server/server.ts) | WebSocket server, session lifecycle, step machine orchestration, wildcard pipeline |
| [`server/services/gameMaster.ts`](server/services/gameMaster.ts) | GM function call dispatcher, scene resolution, Imagen/Veo orchestration |
| [`server/services/gmTools.ts`](server/services/gmTools.ts) | 10 GM tool declarations for Gemini function calling |
| [`server/services/stepMachine.ts`](server/services/stepMachine.ts) | Canonical Act 1 step sequence (steps 8–22), autoplay actions, media triggers |
| [`server/services/keywordLibrary.ts`](server/services/keywordLibrary.ts) | Per-step keyword sets, scene visual context injections |
| [`server/services/acecardGate.ts`](server/services/acecardGate.ts) | Acecard keyword timer, reveal flow, card pickup window |
| [`server/services/dreadTimer.ts`](server/services/dreadTimer.ts) | Dread countdown timer with callback |
| [`server/services/sessionEndings.ts`](server/services/sessionEndings.ts) | Card collection handlers, ending state |
| [`server/services/mediaSafety.ts`](server/services/mediaSafety.ts) | RAI safety filtering for generated media |

---

## Game Systems

- **Trust System**: Float 0.0–1.0 per character. Honesty raises trust; lies lower it. NPC behavior scales accordingly.
- **Step Machine**: 15-step autoplay sequence (steps 8–22) with wall-clock timers + keyword detection. 4 interactive pause points.
- **Wildcard Pipeline**: 3 live-generation events using Imagen 4 + Veo 3.1 (vision feed, game over, good ending). Pre-warmed for latency.
- **Slotsky**: Probability engine triggering 13 anomaly types (CSS/environmental distortions).
- **Acecard Mechanic**: Keyword-gated card discovery with 30s timer window.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/SHOT_SCRIPT.md`](docs/SHOT_SCRIPT.md) | Authoritative Act 1 director's blueprint — phase flow, GM beats, WS events, scene keys, prompts |
| [`docs/SHOT_STEPS.md`](docs/SHOT_STEPS.md) | Scene key registry, canonical media filenames, step machine reference |
| [`docs/Characters.md`](docs/Characters.md) | NPC personality specs, trust behavior, system prompt design |
| [`docs/Gamemaster.md`](docs/Gamemaster.md) | Game Master architecture, tool definitions, perception pipeline |
| [`docs/WORLD_BIBLE.md`](docs/WORLD_BIBLE.md) | Lore, world rules, environmental design |
| [`docs/Contest.md`](docs/Contest.md) | Gemini Live Agent Challenge submission requirements |
| [`AGENTS.md`](AGENTS.md) | Development agent directives, coding standards, execution protocol |
| [`CURRENT_STATE.md`](CURRENT_STATE.md) | Live backend state snapshot, WS event contract, deployment status |

---

## Third-Party Tools Disclosure

This project used third-party tools across planning, staging, development, infrastructure, and asset production. For contest transparency, the breakdown below reflects what was used and how.

### Planning, research, and staging tools

These tools were used for ideation, planning, writing support, research, and staging. They were **not** the runtime engine serving the live game session.

| Tool | Usage |
|---|---|
| **Google Gemini Pro** | Planning, ideation, prompt iteration, research support |
| **NotebookLM** | Organizing notes, summarization, reference synthesis |
| **Grok** | Planning and research support |
| **Perplexity** | Research and fact-finding during staging/planning |

### Asset creation and storyboarding

| Tool | Usage |
|---|---|
| **Morphic Studio** | Storyboarding, still generation, and prebuilt FMV asset creation |

### Development tools

| Tool | Usage |
|---|---|
| **Visual Studio Code** | Primary editor and development environment |
| **GitHub Copilot** | Coding assistance during implementation |
| **Docker** | Container build and deployment packaging |
| **Git / GitHub** | Source control and repository hosting |

### Google Cloud / Google AI services used in this project

The exact tool list evolved during development, but the production system and deployment flow in this repository explicitly use the following Google services and tooling:

| Tool / Service | Usage | Proof |
|---|---|---|
| **Gemini Live API / Vertex AI** | Live multi-agent runtime | [`server/services/gemini.ts`](server/services/gemini.ts) |
| **Imagen 4** | Wildcard image generation | [`server/services/imagen.ts`](server/services/imagen.ts) |
| **Veo 3.1** | Wildcard video generation | [`server/services/veo.ts`](server/services/veo.ts) |
| **Cloud Run** | Backend hosting | [`package.json`](package.json), [`CURRENT_STATE.md`](CURRENT_STATE.md) |
| **Firestore** | Session state and runtime persistence | [`server/services/db.ts`](server/services/db.ts) |
| **Google Cloud Storage** | Hosted stills and video clips | [`server/services/gameMaster.ts`](server/services/gameMaster.ts) |
| **Artifact Registry** | Docker image storage | [`package.json`](package.json) |
| **gcloud CLI** | Deployment/authentication workflow | [`package.json`](package.json) |

---

## Running Locally

### Important: backend repo vs full playable experience

This repository is the **backend/runtime repo**. Judges can inspect the full server architecture here, including the Gemini Live multi-agent runtime, WebSocket event contract, Google Cloud deployment, and canonical media assets.

However, the **full playable experience requires the frontend repo too**. The frontend contains:

- onboarding and permission flow
- WebSocket client transport
- credits sequence
- card overlays
- dread timer UI/SFX
- wildcard CSS effects
- judges route and game presentation layer

If a judge clones **only this backend repo**, they can run and inspect the server, but they will **not** get the complete browser game experience without the frontend.

For a full local reproduction, clone both repos:

```bash
git clone https://github.com/TheSeeker713/liminal-sin-gemini.git
git clone https://github.com/TheSeeker713/myceliainteractive.git
```

Use this repo for the backend and the frontend repo for the browser client.

### 1. Clone the Repository

```bash
git clone https://github.com/TheSeeker713/liminal-sin-gemini.git
cd liminal-sin-gemini
```

If you want the complete playable build locally, also clone the frontend repo:

```bash
git clone https://github.com/TheSeeker713/myceliainteractive.git
```

### 2. Install Dependencies

```bash
npm install
```

Requires **Node.js 20+** and **npm 10+**.

### 3. Environment Setup

Create a `.env.local` file at the project root. **Never commit this file.**

```env
# Google Cloud / Vertex AI (required)
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_REGION=us-west1

# Gemini Live model override (optional — defaults to gemini-live-2.5-flash)
GM_LIVE_MODEL=gemini-live-2.5-flash-native-audio

# Imagen / Veo regions
IMAGEN_REGION=us-west1
VEO_REGION=us-central1

# Debug endpoints (optional — enables /debug/fire-gm-event and /debug/test-wildcard-vision)
DEBUG_GM_ENDPOINT=true
```

**Authentication:** The server uses Google Cloud service account credentials via Application Default Credentials (ADC). Run:

```bash
gcloud auth application-default login
```

Or set `GOOGLE_APPLICATION_CREDENTIALS` to your service account key file path.

**Required GCP APIs:** Vertex AI API, Firestore API, Cloud Run Admin API, Cloud Storage API.

### 4. Run the Server

```bash
npm run server
```

The WebSocket server starts on `ws://localhost:8080/game`. Connect a frontend client or use a WebSocket testing tool.

### 5. Run the Frontend (required for full gameplay)

In the frontend repo, install dependencies and run its dev server according to that repository's README. The frontend is the actual browser experience judges will interact with; this backend alone is not enough for the full end-to-end game loop.

---

## Judges / Reproduction Checklist

If you are a judge or reviewer trying to fully reproduce the submitted experience, use this checklist:

1. Clone **both** repositories:
	- backend/runtime: `liminal-sin-gemini`
	- frontend/client: `myceliainteractive`
2. Install dependencies in both repos.
3. Configure Google Cloud credentials and environment variables for the backend repo.
4. Run the backend WebSocket server from this repo.
5. Run the frontend from the frontend repo.
6. Open the frontend game route in a real browser with microphone/camera permissions enabled.
7. If you only clone this backend repo, you can inspect the architecture and run the server, but you will not have the full browser-playable version by itself.

### 6. Build & Deploy to Cloud Run

```bash
npm run deploy
```

This chains: TypeScript build → Docker build → push to Artifact Registry → deploy to Cloud Run.

Requires Docker Desktop running and `gcloud` CLI authenticated with your GCP project.

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run server` | Start dev server with hot-reload |
| `npm run build` | TypeScript compile to `dist/` |
| `npm run deploy` | Build + Docker + push + Cloud Run deploy |
| `npm run lint` | ESLint check on `server/` |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm start` | Run compiled `dist/server/server.js` |

---

## License

This project (prototype structure, infrastructure code, and documentation) is released under the **MIT License**. Free and open-source for educational and developmental purposes.

All multimedia asset rights (generated videos, audio, images) and the underlying proprietary models belong to their respective platforms, tools, and creators.
