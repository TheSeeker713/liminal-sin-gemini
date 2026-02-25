# CONTEST.md — Gemini Live Agent Challenge
## Submission Strategy, Requirements & Scoring Intelligence
### Version 1.1 | Day 3 — February 25, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 | Characters.md v1.1
### Status: ACTIVE — 19 days to internal deadline

---

> *"While the $80,000 prize pool is significant, the true professional ROI lies in the structural shift toward 'human-on-the-loop' system architecture."*

---

## DEADLINES

| Milestone | Date | Time | Notes |
|---|---|---|---|
| **Internal prototype-ready** | March 11, 2026 | 11:11 PM MT | Our hard self-imposed cutoff |
| **Internal completion target** | March 15, 2026 | EOD | Full vertical slice locked |
| **Official contest deadline** | March 16, 2026 | 5:00 PM PDT | Google's hard cutoff — no exceptions |
| **Today (Day 3)** | February 25, 2026 | — | 19 days to internal deadline |

---

## ELIGIBILITY & CONTENT RULES

- All work must be **100% new — created after February 22, 2026**. No prior code, assets, or models may be carried over.
- Content must comply with **Google's Generative AI Prohibited Use Policy**. This means:
  - **No graphic violence or gore** — liminal horror's psychological aesthetic is the strategic solution. Empty concrete, flickering lights, and spatial disorientation pass all safety filters while maximizing dread.
  - No sexual content, no real-person depictions, no harmful instructions.
- The project must remain **publicly accessible** via GitHub repository for judging.

---

## MANDATORY TECHNICAL REQUIREMENTS

All of the following must be demonstrably integrated in the submission:

| Requirement | Implementation in LIMINAL SIN | Status |
|---|---|---|
| **Gemini Live API** | Real-time bidirectional voice streaming for all character agents. Native barge-in for conversational interruption. | Pending cloud credits |
| **Google GenAI SDK or ADK** | Agent Development Kit manages the full multi-agent hierarchy via AutoFlow delegation. | Pending cloud credits |
| **At least one Google Cloud service** | Google Cloud Run (backend hosting) + Cloud Firestore (state management) | Pending cloud credits |

---

## SUBMISSION DELIVERABLES CHECKLIST

- [ ] **Public GitHub repository** — all code, prompts, and documentation
- [ ] **README.md** — clear project overview, setup instructions, architecture summary
- [ ] **Architecture diagram** — visual map of the multi-agent hierarchy (Game Master → Character Agents → Slotsky → Firestore)
- [ ] **GCP proof** — screenshot or export showing active Google Cloud Run deployment and Firestore database
- [ ] **4-minute demo video** — must show agents hearing and reacting in real-time without post-production editing. Judges are explicitly screening for authentic live interaction.

---

## CONTEST TRACKS — STRATEGIC POSITIONING

LIMINAL SIN is a **hybrid entry** across two tracks:

### Track 1: Live Agents (Primary)
Emphasizes real-time voice and vision interaction, natural conversational flow, and the ability to handle interruptions (barge-in). The bimodal Game Master perceiving the player's webcam is the centerpiece of this track.

### Track 2: Creative Storyteller (Secondary)
Focuses on seamless mixed-media blending — text, image, audio, and video — driving dynamic narrative. The FMV pipeline (Morphic → Grok Imagine → Veo 3.1) and procedural Lyria 3 soundtrack are the centerpiece of this track.

**Hybrid strategy rationale:** Most submissions will pick one track cleanly. LIMINAL SIN's architecture naturally satisfies both. Judges reward entries that push across category boundaries.

---

## SCORING CRITERIA & WEIGHT MAPPING

| Evaluation Criterion | Weight | How LIMINAL SIN Scores |
|---|---|---|
| **Innovation & Multimodal UX** | 40% | Bimodal Game Master (webcam + mic). Barge-in voice interruption. Player emotion detection driving pacing. |
| **Technical Implementation** | 30% | ADK AutoFlow multi-agent hierarchy. Veo 3.1 + Lyria 3 interleaved FMV pipeline. WebSocket bidirectional streaming. |
| **Demo & Presentation** | 30% | 4-minute "Threshold" vertical slice. Proves live latency budget. No post-production trickery. |

**Highest-value feature to demonstrate in the demo:** The moment a character agent *refuses* a player command in real-time. This single interaction proves autonomous agency, trust logic, and Firestore state management simultaneously — all three scoring vectors in one shot.

---

## PRIZE STRUCTURE

| Place | Prize |
|---|---|
| 1st Place | $50,000 |
| 2nd Place | $20,000 |
| 3rd Place | $10,000 |
| Additional awards | Up to $80,000 total pool |

**Secondary ROI (beyond prize money):**
- Public GitHub repo is a permanent portfolio piece demonstrating real-time multimodal AI orchestration
- Hackathon judges include Google Cloud and Vertex AI recruiting teams — direct recruitment pipeline, bypassing standard interview filters
- Engineers who demonstrate ADK mastery command an **estimated 18% salary premium** in the current 2026 AI engineering market

---

## DOCUMENTATION SYSTEM (MANDATORY — CONTEST BONUS POINTS)

Every session must produce:
1. **Screenshots** (minimum 3 per session) → `assets/screenshots/`
2. **Dev log entry** (30-second screen-record + written summary) → `docs/dev-log/YYYY-MM-DD-DayX.md`
3. **GitHub commit** with message format: `Day X – [what was built]`

Post to social with **#GeminiLiveAgentChallenge** for community bonus points and audience building. Platforms: X, LinkedIn, TikTok.

---

## PHASE ROADMAP (21-DAY SPRINT)

| Phase | Days | Focus | Offline-Capable? |
|---|---|---|---|
| **Phase 1: Foundation** | 1–6 | Firestore schema, character .md prompts, Morphic One-Shot models, GitHub repo | ✅ Yes — all offline |
| **Phase 2: Visual Library** | 7–11 | Veo 3.1 FMV clip generation (30–50 clips), Grok Imagine cinematic seeds | Requires credits |
| **Phase 3: Live Integration** | 12–15 | Gemini Live API voice loop, ADK agent deployment, Next.js frontend | Requires credits |
| **Phase 4: Polish & Demo** | 16–21 | End-to-end testing, latency optimization, 4-min demo recording, GCP deployment proof | Requires credits |

**Current status (Day 3):** Executing Phase 1. Cloud credits pending. All documentation and prompt engineering is fully offline-capable and being completed now.

---

## TECHNICAL STACK (CONTEST-COMPLIANT)

| Component | Tool | Contest Requirement Met |
|---|---|---|
| Core reasoning | Gemini 3.1 Pro | ✅ Gemini model |
| Live dialogue | Gemini 2.5 Flash Native Audio | ✅ Gemini Live API |
| Agent orchestration | ADK (AutoFlow) | ✅ Google GenAI ADK |
| Backend hosting | Google Cloud Run | ✅ Google Cloud service |
| State management | Google Firestore | ✅ Google Cloud service |
| Audio generation | Lyria 3 | Google-native |
| FMV pipeline | Morphic → Grok Imagine → Veo 3.1 | Supplementary |
| Frontend | Next.js + WebSocket | Supplementary |

---

## LATENCY BUDGET (JUDGING THRESHOLD)

Immersion breaks when response latency exceeds the human conversational threshold (~2.5 seconds). The system must meet:

\[T_{total} = t_{vad} + t_{llm} + t_{vid} + t_{net}\]

| Component | Target |
|---|---|
| Voice Activity Detection (t_vad) | ~200ms |
| Gemini function call (t_llm) | <500ms |
| FMV clip selection/sync (t_vid) | ~1000ms |
| Network transit (t_net) | ~300ms |
| **Total target** | **~2.0 seconds** |

---

*CONTEST.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Last Updated: Day 3 — February 25, 2026 | Version 1.1*
