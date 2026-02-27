# AGENTS.md

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
- git push
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