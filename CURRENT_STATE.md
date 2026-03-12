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

- [x] Run two VS Code windows in parallel for delivery.
- [x] Backend window: liminal-sin-gemini handles backend checklist items only.
- [x] Frontend window: myceliainteractive handles frontend checklist items only.
- [x] Keep ownership strict: no cross-window implementation edits.
- [x] Sync only through documented WS contract and CURRENT_STATE status deltas.

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

## ⚡ ACTIVE SESSION — Media Pipeline Sprint (March 11, 2026)

> **Context note:** The backend game logic (gmTools, dreadTimer, sessionEndings, card_collected, WS handlers) is 100% complete. The current sprint is focused exclusively on validating and hardening the Imagen 4 + Veo 3.1 Fast media generation pipeline.

### What We Are Trying To Do

Build a chained, FPV-immersive, RAI-safe image→video pipeline for all 12 scene keys. The pipeline must:

1. Generate a reference still (Imagen 4) for the opening scene.
2. Generate a 6-second video from that still (Veo 3.1 Fast).
3. Extract the last frame of that video as a JPEG.
4. Feed that last frame as the reference image into the next scene's video.
5. Repeat for all 12 scene keys in sequence — each scene's video starts from the last frame of the previous one, creating visual continuity.

The experience must feel like first-person smartglasses footage (Jason's POV) — subtle head-bob, breathing tremor, handheld jitter — not a smooth cinematic camera.

---

### Infrastructure Context

| Item | Value |
|---|---|
| GCP Project | `project-c4c3ba57-5165-4e24-89e` (Mycelia Interactive) |
| Org | `digitalartifact11-org` (165684325504) |
| Imagen model | `imagen-4.0-generate-001` / `us-west1` |
| Veo model | `veo-3.1-fast-generate-001` / `us-central1` (NOT us-west1 — NOT_FOUND otherwise) |
| SDK | `@google/genai` — `getVeoAiClient()` in `gemini.ts` → returns GoogleGenAI for `us-central1` |
| Auth | Service account (Vertex AI) — API key approach NOT needed; org policy `Block service account API key bindings` blocks it at org level and Edit is grayed out for this account — **irrelevant, SA auth works fine** |
| ffmpeg | NOT YET INTEGRATED — required for last-frame extraction |

---

### Blocking Issue

`pipeline-variant-benchmark.ts` ran and hit `POLICY_VIOLATION: RAI filtered output` on the **first video** (`zone_tunnel_entry`). The prompt was benign ("First-person POV underground cinematic exploration... no people, no faces"). User confirmed prompts are correct — the RAI filter is oversensitive. No videos were produced; JPEG images were saved successfully.

**Root cause:** Veo safety settings are not configured to `BLOCK_ONLY_HIGH`. The API supports `safetyFilterLevel` in the video generation config.

---

### 5 Active Directives (USER-ISSUED, NOT YET IMPLEMENTED)

These are the exact tasks to execute in the next session, in order:

**1 — Relax safety filters**
- Add `safetyFilterLevel: "block_only_high"` to Veo `generateVideos` config in both `veo.ts` (production) and `pipeline-variant-benchmark.ts` (test script).
- Also add `addWatermark: false` if the SDK accepts it.
- Also fix `veo.ts`: strip string `"horror"` from any prompt template; add `console.warn('[VEO] RAI filter blocked:', ...)` instead of silently returning null.

**2 — Negative prompt system**
- Create a centralized `NEGATIVES` constant (shared between imagen.ts, veo.ts, and benchmark script):
  ```
  "people, faces, person, human, body, hands, crowd, watermark, logo, text, UI, blurry, low quality, overexposed, cartoon, anime, CGI, rendered"
  ```
- Apply as `negativePrompt` param to all Imagen 4 and Veo calls.

**3 — Chained pipeline (last-frame extraction)**
- Integrate ffmpeg via `fluent-ffmpeg` or direct `child_process.spawn` to extract the last frame of a video buffer as JPEG.
- Create a helper `extractLastFrame(videoPath: string): Promise<Buffer>` in a new `scripts/frameExtract.ts`.
- Update `pipeline-variant-benchmark.ts` so that after scene[N] video succeeds, it extracts the last frame and uses it as the reference image for scene[N+1] video (not a fresh Imagen call).
- Scene[0] still uses Imagen for the initial reference. All subsequent scenes chain from the last frame.

**4 — Seed monitor + logging**
- Log the seed value returned by Imagen 4 in the benchmark output (`SceneResult` type + `benchmark.json`).
- Log the seed value returned by Veo if the API exposes it.
- This enables reproducibility and debugging of specific frames.

**5 — FPV/POV video prompts**
- Rewrite ALL 12 `VIDEO_HINTS` entries in `pipeline-variant-benchmark.ts` to include:
  `"point-of-view through smartglasses visor, subtle head-bob from walking motion, slight handheld tremor, natural breathing rhythm visible in frame movement"`
- Remove any language that could imply a person/human is visible.
- The goal: viewers feel they ARE Jason, not that they are watching Jason.

---

### Completed This Session

- [x] `getVeoAiClient()` added to `server/services/gemini.ts`
- [x] `server/services/veo.ts` updated to use `getVeoAiClient`; fallback model chain (`veo-3.1-fast → veo-3.0-fast → veo-3.0`); `enhancePrompt: true`; `durationSeconds: 6`
- [x] `scripts/pipeline-variant-benchmark.ts` created — 12 scene keys, HH:MM:SS timers, saves JPEG + MP4, writes `benchmark.log` + `benchmark.json`, stops on CRITICAL/POLICY_VIOLATION
- [x] `scripts/vanilla-veo-test.ts` created — standalone text-to-video test (no input image), confirmed API connectivity
- [x] Build + lint clean

### Pending / Not Started

- [x] **Directive 1:** Safety filter relaxation (`safetyFilterLevel: "block_only_high"` in veo.ts + benchmark)
- [x] **Directive 2:** Centralized `NEGATIVES` constant in imagen.ts, veo.ts, and benchmark
- [x] **Directive 3:** `scripts/frameExtract.ts` + chained pipeline in benchmark
- [x] **Directive 4:** Seed logging in SceneResult + benchmark.json output
- [x] **Directive 5:** FPV/POV rewrite of all 12 VIDEO_HINTS in benchmark script
- [x] veo.ts: strip "horror" from prompts, add explicit RAI warning log
- [x] Full benchmark run after all above are done
- [ ] Final deploy (`npm run deploy`) — NOT yet triggered

---
