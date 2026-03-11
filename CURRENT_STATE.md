# CURRENT_STATE.md — Liminal Sin Gemini (Backend)

> Setup-phase working memory for backend execution.
> Last updated: March 11, 2026.

---

## Scope

- This document contains backend TODO checklist items and execution instructions only.
- Do not place frontend implementation steps here.
- Setup phase only: planning and checklist alignment, no coding in this step.

---

## Deadlines

- Soft deadline: Friday, March 13, 2026 at 7:13 PM.
- Hard deadline: March 16, 2026 at 5:00 PM PDT.

---

## Line-Length Policy

- Global no-god-code policy remains active.
- Standard source-file caps remain 300/400-line policy per module category.
- Exception files allowed up to 800 lines:
	- CURRENT_STATE.md
	- README.md
	- AGENTS.md
	- docs/SHOT_SCRIPT.md

---

## Phase B Plan — Split Execution Workflow

- [ ] Run two VS Code windows in parallel for delivery.
- [ ] Backend window: liminal-sin-gemini handles backend checklist items only.
- [ ] Frontend window: myceliainteractive handles frontend checklist items only.
- [ ] Keep ownership strict: no cross-window implementation edits.
- [ ] Sync only through documented WS contract and CURRENT_STATE status deltas.

### Backend Window Instructions (This Repo)

- This window executes backend-only tasks from this document.
- Prioritize Event Contract Expansion and Scene Key Expansion first.
- Keep GM silent architecture and lore invariants intact at all times.
- Report progress by checking boxes in this backend file only.

---

## Backend TODO Checklist (SHOT_SCRIPT-Aligned)

### Event Contract Expansion

- [x] Add backend emit path for card_discovered.
- [x] Add backend receive path for card_collected.
- [x] Add backend emit path for dread_timer_start.
- [x] Add backend emit path for game_over.
- [x] Add backend emit path for good_ending.

### Scene Key Expansion

- [x] Add flashlight_beam to backend scene support.
- [x] Add generator_area to backend scene support.
- [x] Add maintenance_area to backend scene support.
- [x] Add card2_closeup to backend scene support.
- [x] Align prewarm set with SHOT_SCRIPT target keys.

### GM and Session Behavior

- [x] Keep GM fully silent (function-call-only architecture).
- [x] Preserve intro gating and timed beat sequencing.
- [x] Maintain trust/fear float handling (0.0-1.0) across events.
- [x] Preserve lore invariants for Jason, Audrey, and Slotsky behavior.

### Dread and Ending Control

- [x] Add backend dread timer lifecycle control (start/cancel/expire path).
- [x] Route timer expiry to game_over event path.
- [x] Route successful card2 completion to good_ending path.

### Compliance and File Health

- [x] Audit oversized backend files against line-cap policy.
- [x] Split large files into focused modules without behavior changes.
- [x] Keep deploy protocol unchanged (npm run deploy flow, no direct deploy command).

---

## Backend Execution Instructions

- Execute checklist in micro-steps and validate each isolated change.
- Keep implementation strictly SHOT_SCRIPT-aligned and lore-safe.
- Do not move trust logic to enum-only behavior; keep float-based logic.
- Do not mix frontend concerns into backend modules.
- Update this document using concise status deltas only.

---
