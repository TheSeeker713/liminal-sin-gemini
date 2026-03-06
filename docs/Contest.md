# CONTEST.md — Gemini Live Agent Challenge
## Submission Strategy, Requirements & Scoring Intelligence
### Version 1.2 | Day 12 — March 6, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 | Characters.md v1.1
### Status: ACTIVE — 5 days to internal cutoff

---

> *"While the $80,000 prize pool is significant, the true professional ROI lies in the structural shift toward 'human-on-the-loop' system architecture."*

---

## DEADLINES

| Milestone | Date | Time | Notes |
|---|---|---|---|
| **Internal prototype-ready** | March 11, 2026 | 11:11 PM MT | Our hard self-imposed cutoff |
| **Internal completion target** | March 15, 2026 | EOD | Full vertical slice locked |
| **Official contest deadline** | March 16, 2026 | 5:00 PM PDT | Google's hard cutoff — no exceptions |
| **Today (Day 12)** | March 6, 2026 | — | 5 days to internal cutoff |

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
| **Gemini Live API** | Real-time bidirectional voice streaming for all character agents. Native barge-in for conversational interruption. | 🔄 In progress — session wiring next |
| **Google GenAI SDK or ADK** | `@google/genai` Vertex AI mode connected. GM tool declarations built. ADK AutoFlow TBD. | ✅ SDK connected |
| **At least one Google Cloud service** | Firestore connected via ADC. Cloud Run Dockerfile ready, deploy pending game logic. | ✅ Firestore live |

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

**Current status (Day 12):** Phase 1 complete (backend skeleton, Firestore, GM tools). Phase 3 starting NOW (Gemini Live voice wiring). Phase 2 (FMV visual library) runs in parallel.

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

---

## JUDGE ACCESS POINT (CRITICAL FOR SUBMISSION)

| Field | Value |
|---|---|
| **Judge Backdoor URL** | `https://myceliainteractive.com/ls/judges` |
| **Direct Game URL** | *(Cloud Run URL — fill in `NEXT_PUBLIC_GAME_URL` when deployed)* |
| **Instructions to Judges** | "Visit the URL above. Click ENTER THE UNDERGROUND. Allow mic + webcam permissions. Speak to Jason." |
| **Devpost Field** | Paste URL in "How judges can access the project" field |

The `/ls/judges` route is a **secret static page** on the marketing site. It is not linked from the public `/ls` page. Share only via Devpost submission notes.

---

## IP & TRADEMARK NOTES (DO NOT CHANGE WITHOUT REVIEW)

| Name | Usage | Status |
|---|---|---|
| **Bally's Casino** | Historical setting reference in WORLD_BIBLE and Characters | ✅ Covered — Bally's LV rebranded to Horseshoe Las Vegas (Dec 2022). Fictional horror framing + `README.md` disclaimer = adequate protection. |
| **The Boring Company** | Tunnel infrastructure referenced as setting | ✅ Covered — `README.md` explicitly disclaims: *"This project does not Sponsor or Endorse any real-world entities, products, or services. This includes, but is not limited to, the Boring Company..."* |
| **Jason / Audrey / Josh** | Character first names | ✅ Covered — same `README.md` disclaimer covers these names as coincidental. |

No action required on any of the above. The existing disclaimer in `README.md` Attribution & Legal section is the protection layer.

---

## COMPETITION LANDSCAPE (as of March 4, 2026)

- **Gallery not published** — Devpost organizers have not opened the project gallery. Zero competitor submissions are visible.
- **Reddit search** (`r/devpost`, `r/gamedev`): no results for Gemini Live Agent Challenge projects
- **X.com search**: blocked without login — cannot verify
- **Devpost "gemini live horror" search**: 23 total results, none from this contest; closest entries:
  - *Seven Doors to Hell* — AR webcam horror arcade (Gemini 3 Hackathon, different contest; no voice, no FMV)
  - *The Unseen Narrator* — CoC AI DM (Hacklytics 2026, different contest; text-based, no FMV)
- **Verdict: No direct competitor has been identified for the Gemini Live Agent Challenge in the FMV horror / voice-narrative space.**

### Liminal Sin Differentiators (Confirmed Unique)
1. Only FMV video pipeline in contest (VEO 3 + Kling 3.0)
2. Only project where player voice IS the mechanic (social engineering NPCs)
3. Only bimodal Game Master watching the player via webcam while invisible to AI characters
4. Only emergent Trust/Fear system with character rebellion behavior
5. Only multi-agent hierarchy with 4 distinct agents (Director + Jason + Audrey + Josh)

---

## SESSION UPDATE LOG

| Date | Day | What Changed |
|---|---|---|
| Feb 25, 2026 | Day 3 | Initial CONTEST.md created. Phase 1 docs complete. |
| March 4, 2026 | Day ~10 | Added: judge access point, IP notes, competition landscape, differentiation summary. Phase 1 cloud work NOT YET STARTED — BLOCKING. |

---

*CONTEST.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Last Updated: Day ~10 — March 4, 2026 | Version 1.2*
