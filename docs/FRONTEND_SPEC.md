# FRONTEND_SPEC.md — Liminal Sin Frontend Specifications

## Version 3.0 | March 15, 2026

> Extracted from SHOT_SCRIPT.md. Frontend-only UI specs for persistent gameplay elements.

---

## ⚠️ FRONTEND NOTE — JASON TRUST METER (PERMANENT UI)

> **Priority: HIGH — Permanent UI feature. Do NOT remove during any refactor.**

A **Trust Meter** widget must be rendered in the **lower-right corner** of the screen at all times during active gameplay. It is a minimal, always-on overlay that displays Jason's current emotional state in real time.

**Data source:** `trust_update` WS event — `{ trust_level: number, fear_index: number }`

- `trust_level` — float `0.0–1.0`. Drives the Trust bar.
- `fear_index` — float `0.0–1.0`. Drives the Fear bar.

**Visual spec:**

- Two labeled bars stacked vertically, lower-right corner, fixed position.
- Labels: `TRUST` and `FEAR` (all caps, monospace or horror-adjacent font to match game aesthetic).
- Bar fill reflects the float value (e.g. `0.75` = 75% fill).
- Color suggestion: Trust = cold blue or green; Fear = deep red or amber.
- No border, no background panel — blends into the scene, never breaks immersion.

**Animation — slow pulse (fade in / fade out only):**

- The entire widget pulses with a slow, continuous CSS `opacity` animation — fade in to full opacity, hold briefly, fade out to ~20% opacity, repeat.
- Suggested timing: ~5s per full cycle (e.g. `animation: trust-pulse 5s ease-in-out infinite`).
- The pulse is **cosmetic only** — it runs continuously while the widget is active, regardless of data changes. A data change does NOT reset or interrupt the pulse cycle.

**Activation gate — Phase 3 / Phase 4 boundary:**

- The widget is **hidden** (opacity: 0, no animation) during Phase 1 (onboarding) and Phase 2 (credits).
- The widget **activates** (becomes visible and begins pulsing) when the frontend receives the `player_speak_prompt` event (the Phase 3 → Phase 4 transition).
- Initial values before the first `trust_update` arrives: `trust_level = 0.5`, `fear_index = 0.3` (neutral defaults).

**Data updates:**

- On every `trust_update` event received over WS, animate the bar fill smoothly to the new value (CSS transition ~500ms).
- The pulse animation runs on top of/independently from the bar fill transition.

---

_FRONTEND_SPEC.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 3.0 | March 15, 2026_
_Canon. Cross-reference: SHOT_SCRIPT.md | WS_EVENTS.md | AGENTS.md_
