# AGENTS.md — Liminal Sin Gemini Project

> **This file lives permanently at the project source root.**
> `AGENTS.md` and `README.md` cannot be moved, renamed, replaced, or deleted without the user's explicit command or permission.

---

## 1. Identity & Purpose

**Liminal Sin** is an interactive, voice-driven FMV psychological horror experience set in the Vegas Underground, powered by Google Gemini's multi-agent system.

### System Architecture

| Agent | Role |
|---|---|
| **The Game Master (Overseer)** | Controls world state, tracks Trust Levels, escalates dread, triggers FMV sequence warping and visual glitches. |
| **The NPCs (The Lost)** | Driven by player voice input. Emotional but rational; behavior scales with the player's current Trust level. |

### The Trust System

| State | Trigger | NPC Behavior |
|---|---|---|
| **Neutral** (default) | Starting state | Cautious but willing to listen; withholds critical survival secrets. |
| **High Trust** | Honesty, reliable guidance | Compliant; offers environmental clues and survival hints. |
| **Low Trust** | Lies, leading NPCs into traps | Unpredictable; may disobey, hide information, or spiral into paranoia. |

---

## 2. Core Rules

1. **Read Before Acting** — Before generating any plan, writing any code, or running any command, you MUST read this file AND all mandatory lore documents listed in **Section 9** below. This is non-negotiable. Code written without lore context will contradict character behavior, trust mechanics, world rules, or contest requirements. See Section 9 for the full required reading list.
2. **Blind Obedience** — The rules in this file supersede any default AI behaviors.
3. **Acknowledge** — Begin every response with `"AGENTS.md acknowledged"`.
4. **Protected Files** — `AGENTS.md` and `README.md` always reside at the project source root and cannot be moved, renamed, replaced, or deleted without the user's explicit command or permission.
5. **Ignore Commented Content in Docs** — Any content wrapped in an HTML comment (`<!-- -->`), a code block comment (`/* */`), a JSX comment (`{/* */}`), or a line comment (`//`) inside ANY documentation file (including `AGENTS.md`, `CURRENT_STATE.md`, `TEAM_CONTRACT.md`, `Characters.md`, anything under `docs/`, etc.) is **permanently out of scope**. Do NOT read it, extract specifications from it, reference it, implement based on it, or be influenced by it in any way. Commented-out content is explicitly retired from the active specification — treat it as if it does not exist. Skip over it entirely when reading docs.

---

## 3. Safety Permissions

**Always ask the user before:**
- Removing or deleting any code or files
- Installing new packages or dependencies
- Running a full project-wide build or end-to-end test suite
- Making changes that touch more than one file or module
- Altering the core Game Master Trust logic

**Allowed without prompting:**
- Reading or listing files
- Type-checking, formatting, or linting a single file
- Running a single unit test file

**Hard rules — never do these:**
- Do **NOT** hardcode API keys. Always use environment variables.
- Do **NOT** overwrite or replace existing functional code just to make it "cleaner" or "better". Modify only the exact lines required for the current objective.
- Do **NOT** add new heavy dependencies without explicit approval.
- Do **NOT** refactor code unless explicitly commanded. If it works, leave it alone.
- **Always run `npm run build` before any deploy when the project uses `output: "export"` (static export).** Never run `wrangler deploy` or any deploy command directly without building first. Use `npm run deploy` (which chains build + deploy) rather than calling the deploy tool directly.
- Maintain the dark, surreal, and tense tone of the Vegas Underground in all generated UI text and agent prompts.
- **Hallucination / context-loss recovery** — If at any point you are about to overwrite existing code (due to loss of context, hallucination, or uncertainty), **do NOT delete the original**. Instead, comment it out in-place and add a brief inline explanation (e.g. `// [AI: replaced because X — original preserved below for user review]`). This ensures no working logic is silently lost and the user can always restore it.
- **Dead End Protocol (Anti-Spiral Rule)** — See Section 3a below.

---

## 3a. Dead End Protocol — Anti-Spiral Rule

**Trigger condition** — STOP and surface to the user if ANY of the following occur:
- The same error appears after **2 consecutive fix attempts**
- A fix requires removing or commenting out existing functional code as a "diagnostic step"
- The root cause cannot be determined from reading the code and error message alone

**Required behavior — report before touching any more code:**
1. State the exact error message (copy verbatim)
2. State what was already tried (max 3 bullet points)
3. State one specific hypothesis about the root cause
4. Ask the user one targeted question to confirm or deny that hypothesis

**Forbidden responses to errors:**
- Do **NOT** make destructive changes (removing config blocks, stripping parameters, deleting imports) as diagnostic steps — this leaves the codebase broken for the user
- Do **NOT** retry the same approach with minor variations more than once
- Do **NOT** continue iterating silently until context is exhausted

**Hard limit:** If the error is not resolved after 2 targeted fixes, the agent MUST surface the problem to the user before writing any more code.

---

## 4. Coding Standards

- Default to **small, focused components** — avoid god components.
- Default to **small files and focused diffs** — avoid repo-wide rewrites unless explicitly asked.
- When adding features, prefer **appending new functions or creating new files** over mutating existing functional logic.
- Always lint, type-check, and test **only the modified files**. Reserve a full project build for when explicitly requested.
- Execute tasks in the **smallest possible increments**. Never write a massive block spanning multiple concerns in one step.

---

## 5. Commands Reference

```bash
# Type-check a single file
npx tsc --noEmit path/to/file.tsx

# Format a single file
npm run prettier --write path/to/file.tsx

# Lint a single file
npx eslint --fix path/to/file.tsx

# Run a single unit test file
npm run vitest run path/to/file.test.tsx

# Full build — ONLY when explicitly requested by the user
npm run build
```

---

## 6. Execution Protocol

Follow this exact, unbreakable protocol for every feature, component, or integration:

**STEP 1 — The Micro-Plan**
- Output a step-by-step plan before writing any code.
- Break the task into microscopic, isolated steps.
- Wait for user approval before proceeding.

**STEP 2 — Execute ONE Tiny Step**
- Execute ONLY Step 1. Do not touch Step 2.
- Write the minimal code required to satisfy that single step.
- Always ask before removing code or deleting files.

**STEP 3 — Mandatory Testing**
- Run `npx tsc --noEmit`, `npm run prettier --write <file>`, and `npx eslint` on modified files only.
- If errors occur, stop and fix them. Do not advance to Step 4.

**STEP 4 — Commit and Push**
```bash
git add .
git commit -m "feat/fix: completed [Step Name] - tiny increment"
git push origin main
```

**STEP 5 — Await Human Confirmation**
- Ask: *"Step complete and pushed to main. Ready for the next step?"*
- Only proceed after the user says "yes".

---

## 7. API & Cloud Documentation

- Gemini Live integration patterns → `docs/ai/`
- Cloud deployment → `docs/cloud/`

---

## 8. PR Checklist

- [ ] Diff is small and focused
- [ ] Commit message includes a brief summary of what changed and why
- [ ] No excessive `console.log` or debug output left in
- [ ] Lint, type-check, and tests pass on modified files only

---

## 9. Mandatory Lore & Character Consistency Reading

> **This section is enforced by Rule 2 (Blind Obedience) and Rule 1 (Read Before Acting).**
> Before touching ANY system prompt, agent config, Firestore schema, trust logic, tool declaration, or NPC behavior — read the relevant docs below. Lore violations in prompt engineering are invisible bugs: the model will generate lore-incoherent responses at runtime with no error thrown.

### Required Reading — Always Read Before Acting

| Document | Path | What It Governs |
|---|---|---|
| **WORLD_BIBLE.md** | `docs/WORLD_BIBLE.md` | Canon world layers, noclip lore, character ADK prompts, Slotsky definition, trust mechanic overview, Firestore schema, proximity states, fourth-wall protocol, FMV intro sequence. **This is the source of truth.** |
| **Characters.md** | `docs/Characters.md` | Full production-ready ADK system prompts for Jason, Audrey, Josh, Slotsky, and Game Master. Trust behavior tables (float 0.0–1.0). Mask-drop dialogue anchors. Character knowledge boundaries. Firestore per-character state variables. |
| **Gamemaster.md** | `docs/Gamemaster.md` | GM bimodal perception pipeline (webcam 1 FPS + mic). Affective pacing table. FMV scene_key selection logic and canonical key format. Voice routing by proximity_state. Fourth-wall count state machine. Slotsky trigger dispatch flags. Firestore schema (GM-managed fields). |
| **Backpack.md** | `docs/Backpack.md` | Jason's full inventory manifest. Smart glasses filter modes and their GM triggers. HUD elements. Gear-as-trust mechanic tables. Item degradation by layer. |
| **Instructions.md** | `docs/Instructions.md` | Player-facing UX flow (no menus, no HUD, no pause). Phase-by-phase session architecture: Intro FMV → Static Loop → First Contact → Active Play → FMV Playback. Core interaction loop. Barge-in protocol. Relay mechanic rules. |
| **Tunnel-and-park.md** | `docs/Tunnel-and-park.md` | Act 1 physical world spec. Sub-zone IDs for scene_key mapping. Lighting spec by zone. Audio landscape (static and reactive ambient). Slotsky's physical territory. AI generation prompts (canonical). |
| **Player_voice.md** | `docs/Player_voice.md` | Player role definition: disembodied voice, barge-in capable, trust is earned in real-time. |
| **Contest.md** | `docs/Contest.md` | Deadlines (internal: March 11, hard cutoff: March 16, 5:00 PM PDT). Mandatory technical requirements. Scoring weights. Phase roadmap. Demo requirements. |
| **AUDIO_DESIGN.md** | `docs/AUDIO_DESIGN.md` | ⚠️ **PENDING CREATION — do not implement any audio generation, Lyria 3 integration, or crossfade mixer logic until this document exists and has been read.** Governs: track generation palette, crossfade timing, silence zones, intensity ramping, emergency silence protocol. |

### Lore Consistency Invariants — Never Violate These

1. **The GM never speaks.** It is architecture. It uses function calls only. Any code that routes Gemini audio output from the GM prompt directly to the player is architecturally wrong.
2. **Trust is a float 0.0–1.0 per character.** The three-state enum (`High/Neutral/Low`) is a simplification — behavioral thresholds in Characters.md use float ranges.
3. **scene_key format:** `{character}_{emotion}_{context}_{action}` — e.g. `jason_afraid_tunnel_looking`. Never invent freeform keys like `waterpark_flood_reveal`.
4. **Slotsky never speaks, never appears, never targets a specific character.** It responds only to session state flags.
5. **Jason cannot be pushed into a suicidal command regardless of trust level.** This is hardcoded persona.
6. **Audrey goes silent (not hostile) at trust < 0.2.** She does not respond until a trust-rebuilding event occurs.
7. **USB drive is Act 2 content.** Do not unlock it or reference its contents in Act 1 logic.
8. **No title screen. No pause. No game over screen.** The experience degrades — it does not fail.
9. **ADK/AutoFlow is NOT implemented and is deferred post-contest.** Current architecture is direct GenAI SDK + WebSocket. Do not write code assuming ADK is present. Reconsider for Act 2 multi-agent spawning requirements only.
10. **Vertex AI Memory Bank and long-term storage are deferred.** Game state lives in Firestore. Media assets should use Google Cloud Storage (GCS). Do not implement Vertex AI Memory Bank without explicit approval. Do not migrate game state out of Firestore.
11. **Lyria 3 audio is deferred.** Do not implement any audio generation, crossfade mixing, or Lyria API calls until `docs/AUDIO_DESIGN.md` is created and approved.

---
