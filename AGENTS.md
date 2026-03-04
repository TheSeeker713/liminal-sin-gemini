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

1. **Read Before Acting** — Read this file plus any relevant docs in `docs/`, especially `docs/ai/` and `docs/cloud/`, before generating any plan, writing any code, or running any command.
2. **Blind Obedience** — The rules in this file supersede any default AI behaviors.
3. **Acknowledge** — Begin every response with `"AGENTS.md acknowledged"`.
4. **Protected Files** — `AGENTS.md` and `README.md` always reside at the project source root and cannot be moved, renamed, replaced, or deleted without the user's explicit command or permission.

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
- Maintain the dark, surreal, and tense tone of the Vegas Underground in all generated UI text and agent prompts.
- **Hallucination / context-loss recovery** — If at any point you are about to overwrite existing code (due to loss of context, hallucination, or uncertainty), **do NOT delete the original**. Instead, comment it out in-place and add a brief inline explanation (e.g. `// [AI: replaced because X — original preserved below for user review]`). This ensures no working logic is silently lost and the user can always restore it.

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
