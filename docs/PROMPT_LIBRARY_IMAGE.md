# PROMPT_LIBRARY_IMAGE.md - Act 1 Image Prompt Library

Status: Draft v1 (implementation source)
Date: March 12, 2026
Scope: Act 1 image prompts only

Purpose:
- Define the authoritative still-image prompt library for Act 1.
- Map sequence steps to image usage rules.
- Separate primary prompts from fallback and removal-later prompts.

Authority:
- This document is co-authoritative with SHOT_SCRIPT and PROMPT_QUEUE_SEQUENCE.
- If sequence behavior in this file is missing from SHOT_SCRIPT, SHOT_SCRIPT must be updated.

## Global Image Constraints

1. All images are first-person POV from Jason's perspective.
2. Steps 1-8 are darkness-first and must not generate environmental stills.
3. No explicit human faces or external third-person framing.
4. No smartglasses UI overlays inside generated images.
5. Waterpark framing must be functional liminal paradise, not ruined-decay as primary tone.

## Scene Key Classification

Primary Act 1 keys (active flow):
- flashlight_beam
- generator_area
- zone_park_shore
- maintenance_area
- slotsky_card
- card2_closeup

Fallback keys (temporary, non-primary):
- zone_tunnel_entry
- zone_tunnel_mid
- zone_merge
- zone_park_shallow
- zone_park_slides
- zone_park_deep

Removal-later candidates:
- zone_tunnel_entry
- zone_tunnel_mid
- zone_merge
- zone_park_shallow
- zone_park_slides
- zone_park_deep

Note:
- Removal-later means keep in code for now, remove in a dedicated cleanup sprint after full queue migration validation.

## Canonical Image Prompt Entries

### IMG_FLASHLIGHT_BEAM -> scene_key: flashlight_beam
Prompt intent:
- Total darkness punctured by a single flashlight beam.
- Limited visibility and wet concrete detail in beam only.
Usage:
- First visual reveal after darkness-only opening.
- Supports Step 9 and flashlight transition states.
Forbidden reveals:
- No broad environmental reveal before beam sweep context is established.

### IMG_GENERATOR_AREA -> scene_key: generator_area
Prompt intent:
- Industrial generator anchor in dark environment.
- Card near generator visible only under directed light.
Usage:
- Step 11 still frame after flashlight exploration video.
- Step 14 card interaction context.

### IMG_PARK_SHORE -> scene_key: zone_park_shore
Prompt intent:
- Functional liminal paradise waterpark reveal.
- Beautiful but unsettling perfection, not ruin-only framing.
Usage:
- Step 16 post-video still anchor.
- Step 17 exploration still fallback.

### IMG_MAINTENANCE -> scene_key: maintenance_area
Prompt intent:
- Maintenance access with visible contrast against paradise glow.
Usage:
- Step 18 discovery anchor.
- Step 19 end-sequence entry still.

### IMG_SLOTSKY_CARD -> scene_key: slotsky_card
Prompt intent:
- Deliberate card placement as anomaly marker.
Usage:
- Mid-to-late dread escalation still anchor.
- Final objective hinting.

### IMG_CARD2_CLOSEUP -> scene_key: card2_closeup
Prompt intent:
- Final collectible focus and ending branch emphasis.
Usage:
- Step 20 final-card branch resolution still.

## Sequence-to-Image Mapping (Step 1-21)

1. Falling down
- Image mode: NONE (black screen only)

2. Landing
- Image mode: NONE (black screen only)

3. Jason cannot see yet
- Image mode: NONE

4. Pre-mic Jason monologue
- Image mode: NONE

5. Mic/camera enable gate
- Image mode: NONE

6. LIVE TALK text appears
- Image mode: NONE (overlay only)

7. Live interaction begins, trust/fear shown
- Image mode: NONE 

8. Darkness timer and autonomy phase
- Image mode: NONE

9. Flashlight scene kicks in
- Image mode: IMG_FLASHLIGHT_BEAM

10. Flashlight orientation and generator search video phase
- Image mode: optional freeze fallback IMG_FLASHLIGHT_BEAM on video handoff

11. Generator found, shift to still with animated overlay
- Image mode: IMG_GENERATOR_AREA

12. Generator interaction gate window
- Image mode: IMG_GENERATOR_AREA

13. Generator on (video)
- Image mode: optional post-video still IMG_PARK_SHORE preparation frame

14. Joker card interaction branch
- Image mode: IMG_GENERATOR_AREA (pre-pick)

15. Post-card glitch reveal and player warp
- Image mode: base still IMG_GENERATOR_AREA with overlay effect

16. Waterpark reveal then still
- Image mode: IMG_PARK_SHORE

17. Park exploration branch
- Image mode: IMG_PARK_SHORE primary
- Optional ambient fallback: zone_park_shallow, zone_park_slides, zone_park_deep (temporary)

18. Maintenance discovery + distant female voice
- Image mode: IMG_MAINTENANCE

19. Enter maintenance end sequence
- Image mode: IMG_MAINTENANCE

20. Final card objective branch
- Image mode: IMG_CARD2_CLOSEUP (or IMG_SLOTSKY_CARD lead-in)

21. Session pacing envelope
- Image mode: follow active branch; no unqueued random still generation

## Prompt Delta Requirements

Required rewrites:
1. zone_park_shore prompt text in code should be aligned to paradise-forward language.
2. Any prompt language implying abandoned ruin as dominant identity should be reduced where it conflicts with paradise canon.

Required runtime policy:
1. No scene_image events in Steps 1-8.
2. First scene_image event must be flashlight_beam.

## Prewarm Policy

Primary prewarm target set (recommended):
- flashlight_beam
- generator_area
- zone_park_shore

Temporary compatibility set (current):
- flashlight_beam
- zone_merge
- zone_park_shore

Migration note:
- Keep current set until runtime queue is switched to this library, then move to primary set.

## Validation Checklist

1. Confirm first generated image in a run is flashlight_beam.
2. Confirm no scene image appears before TALK phase completion and flashlight trigger.
3. Confirm generator still appears before card pickup interaction.
4. Confirm park reveal still uses paradise-forward framing.
5. Confirm maintenance still appears before final card/end branch.
6. Confirm fallback keys are not called in primary flow unless explicitly branched.
