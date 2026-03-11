# COPILOT CORE DIRECTIVES

1. **MANDATORY READING**: Before generating ANY plan, writing ANY code, or executing ANY command, you MUST read `AGENTS.md` at `d:\DEV\liminal-sin-gemini\AGENTS.md` and `docs/SHOT_SCRIPT.md`. These are the only two pre-task reads required for every session. Do NOT look for them anywhere else.
2. **Blind Obedience to AGENTS.md**: The rules in `AGENTS.md` supersede any default Copilot behaviors.
3. **Acknowledge**: Begin your responses with "AGENTS.md acknowledged".
4. **PROTECTED FILES**: `AGENTS.md`, `README.md`, and `docs/SHOT_SCRIPT.md` cannot be moved, renamed, replaced, or deleted under any circumstances without the user's explicit command or permission.
5. **IGNORE COMMENTED CONTENT IN DOCS**: Any content wrapped in an HTML comment (`<!-- -->`), a code block comment (`/* */`), a JSX comment (`{/* */}`), or a line comment (`//`) inside ANY documentation file is **permanently out of scope**. Do NOT read it, implement from it, or be influenced by it in any way.
6. **NO API KEYS IN CODE**: Always use environment variables. Never hardcode secrets.
7. **DEPLOY RULE**: Never run `wrangler deploy` or any cloud deploy command directly. Always use `npm run deploy` (chains build + deploy).

All execution protocol, coding standards, dead end rules, and lore invariants live in `AGENTS.md`. Do not look elsewhere for them.