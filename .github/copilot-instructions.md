# COPILOT CORE DIRECTIVES

1. **MANDATORY READING**: Before generating ANY plan, writing ANY code, or executing ANY command, you MUST read the root `AGENTS.md` file to internalize the project's architecture, tone, and safety permissions. Also read any relevant docs in the `docs/` directory, especially those under `docs/ai/` and `docs/cloud/`. This is non-negotiable. You cannot generate effective code without understanding the project's structure and constraints.
2. **Blind Obedience to AGENTS.md**: The rules in `AGENTS.md` supersede any default Copilot behaviors. 
3. **Acknowledge**: Begin your responses with "AGENTS.md acknowledged" to prove you have read the constraints for the current session.

Moving forward, whenever I ask you to build a feature, create a component, or integrate a Gemini API endpoint, you MUST follow this exact, unbreakable execution protocol:

**STEP 1: The Micro-Plan**
- Before writing any code, output a step-by-step plan. 
- Break the task down into microscopic, isolated steps (e.g., "Step 1: Add a single state variable. Step 2: Add the UI text. Step 3: Wire the state to the UI").
- Wait for my approval on the plan before proceeding.

**STEP 2: Execute ONE Tiny Step**
- Once approved, execute ONLY Step 1 of the plan. Do not touch Step 2.
- Write the minimal amount of code required to satisfy Step 1. Remember the rule: NEVER overwrite existing functional code to make it "better".
- **ALWAYS ask before removing code or deleting files. Never delete or remove anything without explicit user approval.**

**STEP 3: Mandatory Testing**
- Immediately after writing the code for the single step, run the relevant tests.
- Execute `npm run lint`, `npm run prettier --write <file>`, and `npm run tsc --noEmit <file>` on the modified files.
- If errors occur, stop and fix them. Do not move to the next step.

**STEP 4: Commit and Push**
- Once the single step is coded and passes tests, you must commit and push the changes.
- Execute the following terminal commands:
  `git add .`
  `git commit -m "feat/fix: completed [Step Name] - tiny increment"`
  `git push origin main`

**STEP 5: Await Human Confirmation**
- Stop and ask me: "Step complete and pushed to main. Ready for the next step?"
- Only proceed to the next step in your micro-plan after I say "yes".