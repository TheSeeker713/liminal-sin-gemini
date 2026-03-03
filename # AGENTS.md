# AGENTS.md: Core Multi-Agent Architecture & Rules

## 1. System Architecture: The "Liminal Sin" Engine
This project utilizes a multi-agent system powered by Gemini to create an interactive, voice-driven FMV psychological horror experience. 
* **The Game Master (Overseer):** Controls the world state, tracks global variables (like Trust Levels), escalates dread, and triggers FMV sequence warping or visual glitches.
* **The NPCs (The Lost):** Individual agents relying purely on player voice input. They are emotional but rational enough to follow (or reject) instructions based on their Trust level. 

## 2. The Trust System Core Mechanic
Trust is the primary variable dictating NPC behavior. It must be tracked and updated by the Game Master based on player actions and speech.
* **Neutral (Default):** NPCs are cautious but willing to listen. They provide basic information but withhold critical survival secrets. 
* **High Trust (Earned):** Achieved through honesty and reliable guidance. NPCs become compliant, easier to direct through the liminal spaces, and offer helpful environmental clues.
* **Low Trust (Deceived):** Triggered if the player lies or leads them into traps. NPCs become unpredictable, may actively disobey commands, hide information, or succumb to paranoia. 

## 3. Safety Permissions & Execution Rules
* **Strict Adherence:** AI coding assistants must NEVER alter the core Game Master Trust logic without explicit developer confirmation.
* **API Usage:** Do not hardcode API keys. Always rely on environment variables.
* **Tone:** Maintain the dark, surreal, and tense tone of the Vegas Underground in all generated UI text and agent prompts.

### Do
- default to small components. prefer focused modules over god components
- default to small files and diffs. avoid repo wide rewrites unless asked
- Always lint, test, and typecheck updated files only. Use project-wide build sparingly.

### Don't
- do not add new heavy dependencies without approval
- do not overwrite preexisting code — use surgical, precise edits only

### Commands
# Type check / format / lint a single file by path
npm run tsc --noEmit path/to/file.tsx
npm run prettier --write path/to/file.tsx
npm run eslint --fix path/to/file.tsx
# Unit tests - single file
npm run vitest run path/to/file.test.tsx
# Full build ONLY when explicitly requested
yarn build:app

### Safety and permissions
Allowed without prompt:
- read files, list files
- tsc single file, prettier, eslint, vitest single test

Ask first: 
- package installs
- deleting files, chmod
- running full build or end-to-end suites
- any change touching more than one file or module

### Project structure
- see root README.md and docs/architecture.md for overall layout
- frontend lives in /apps/web (Next.js / v0-generated)
- backend lives in /apps/api or /services
- cloud infra in /infra (Cloud Run, Vertex AI, etc.)
- AI live agent endpoints in /agents/gemini-live

### Good and bad examples
- data layer: use approved client in /lib/api/client.ts — do not fetch directly
- reference ./docs/api/*.md before any endpoint change

### API / Cloud docs
- All Gemini Live integration patterns in docs/ai/GEMINI_INTEGRATION.md
- Cloud deployment in docs/cloud/GCP.md

### PR checklist
- diff is small and focused
- include brief summary of what changed and why
- remove any excessive logs before sending

### When stuck
- ask clarifying question, propose short micro-plan (max 5 bullets), wait for approval

### Test first mode
- when adding new features or cloud/AI components: write or update tests first, then code to green

### Memory hierarchy
- ALWAYS read this file + docs/ai/* + docs/cloud/* + docs/architecture.md first
- If context missing, say “Re-reading memory hierarchy…” and ask

### Strict Execution & Modification Rules
1. **Never Overwrite for "Elegance"**: NEVER overwrite or replace existing code simply to make it "better", "cleaner", or more "elegant". Only modify the exact lines necessary to achieve the current specific objective.
2. **Append-First Mentality**: When adding features, default to appending new functions or creating new files rather than mutating existing functional logic.
3. **Micro-Stepping**: ALWAYS execute tasks in the smallest possible increments. Never write a massive block of code spanning multiple concerns.
4. **No Unprompted Refactoring**: Do not refactor code unless explicitly commanded by the user. If functional code works, leave it alone.