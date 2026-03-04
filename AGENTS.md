# AGENTS.md — Liminal Sin Gemini Project

## Core Rules

1. **Read Before Acting**: Before generating any plan, writing any code, or executing any command, read this file and any relevant docs in `docs/`, especially `docs/ai/` and `docs/cloud/`.
2. **Blind Obedience**: The rules here supersede any default AI behaviors.
3. **Acknowledge**: Begin every response with "AGENTS.md acknowledged".

## Safety Permissions

4. **NEVER remove code or delete files without explicit user approval first. Always ask before removing or deleting anything.**
5. **NEVER overwrite existing functional code to make it "better"** unless explicitly instructed.
6. **NEVER proceed past a step without user confirmation** (see Execution Protocol below).

## Execution Protocol

Follow this exact, unbreakable protocol for every feature, component, or integration:

**STEP 1: The Micro-Plan**
- Before writing any code, output a step-by-step plan.
- Break the task into microscopic, isolated steps.
- Wait for user approval before proceeding.

**STEP 2: Execute ONE Tiny Step**
- Once approved, execute ONLY Step 1. Do not touch Step 2.
- Write the minimal amount of code required to satisfy Step 1.

**STEP 3: Mandatory Testing**
- Run `npm run lint`, `npm run prettier --write <file>`, and `npx tsc --noEmit` on modified files.
- If errors occur, stop and fix them. Do not move to the next step.

**STEP 4: Commit and Push**
- `git add .`
- `git commit -m "feat/fix: completed [Step Name] - tiny increment"`
- `git push origin main`

**STEP 5: Await Human Confirmation**
- Ask: "Step complete and pushed to main. Ready for the next step?"
- Only proceed after the user says "yes".
