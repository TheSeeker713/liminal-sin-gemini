# PROMPT_LIBRARY_VIDEO.md - Act 1 Video Prompt Library

Status: Draft v1 (implementation source)
Date: March 12, 2026
Scope: Act 1 video prompts only

Purpose:
- Define the authoritative video prompt queue for Act 1.
- Bind each video clip to exact triggers and stop conditions.
- Preserve story continuity for active play and no-player autoplay.

Authority:
- This document is co-authoritative with SHOT_SCRIPT and PROMPT_QUEUE_SEQUENCE.
- If required queue behavior here is missing from SHOT_SCRIPT, SHOT_SCRIPT must be updated.

## Global Video Constraints

1. No video generation in Steps 1-8 (darkness-first opening).
2. First video phase starts only after flashlight trigger.
3. Video clips must support interruption and fallback-to-still transitions.
4. No third-person framing. Jason POV only.
5. No visible UI overlays rendered into generated video.
6. Waterpark presentation is functional liminal paradise, not decayed ruin as primary identity.

## Scene Key Classification

Primary Act 1 video keys:
- flashlight_beam
- generator_area
- zone_park_shore
- maintenance_area
- slotsky_card
- card2_closeup

Fallback video keys (temporary, non-primary):
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

## Canonical Video Queue Entries

### VID_FLASHLIGHT_ORIENT -> scene_key: flashlight_beam
Narrative purpose:
- Jason regains bearings using the flashlight in total darkness.
Trigger:
- Step 9 flashlight activation (player command or 60s autoplay).
Stop condition:
- Orientation completed or player interruption.
Fallback:
- Freeze to IMG_FLASHLIGHT_BEAM still.

### VID_FLASHLIGHT_SCAN_GENERATOR -> scene_key: generator_area
Narrative purpose:
- Search sweep toward generator location.
Trigger:
- Immediately after VID_FLASHLIGHT_ORIENT.
Stop condition:
- Generator located.
Fallback:
- Freeze to IMG_GENERATOR_AREA still.

### VID_GENERATOR_ON -> scene_key: zone_park_shore
Narrative purpose:
- Generator activation causes environmental reveal.
Trigger:
- Step 13 (player instruction or autoplay).
Stop condition:
- Activation complete and reveal transition achieved.
Fallback:
- Freeze to IMG_PARK_SHORE still.

### VID_CARD1_PICKUP -> scene_key: generator_area
Narrative purpose:
- Card pickup event (Joker/first collectible branch behavior).
Trigger:
- Step 14 card collect action or timeout auto-pick.
Stop condition:
- Card is in hand and branch state is committed.
Fallback:
- Freeze to IMG_GENERATOR_AREA still.

### VID_PARK_EXPLORE -> scene_key: zone_park_shore
Narrative purpose:
- Controlled exploration of waterpark liminal paradise state.
Trigger:
- Step 16 post-glitch phase.
Stop condition:
- Maintenance lead discovered or timeout auto-advance.
Fallback:
- Freeze to IMG_PARK_SHORE still.

### VID_MAINTENANCE_APPROACH -> scene_key: maintenance_area
Narrative purpose:
- Approach maintenance corridor and transition to end sequence.
Trigger:
- Step 18 discovery and Step 19 progression.
Stop condition:
- End branch interaction state starts.
Fallback:
- Freeze to IMG_MAINTENANCE still.

### VID_FINAL_CARD_RESOLUTION -> scene_key: card2_closeup
Narrative purpose:
- Final card objective confirmation and ending branch transition.
Trigger:
- Step 20 final interaction state.
Stop condition:
- Good ending or game over path is resolved.
Fallback:
- Freeze to IMG_CARD2_CLOSEUP still.

## Sequence-to-Video Mapping (Step 1-21)

1. Falling down
- Video mode: NONE

2. Landing
- Video mode: NONE

3. No-vision constraint
- Video mode: NONE

4. Pre-mic monologue
- Video mode: NONE

5. Mic/camera enable gate
- Video mode: NONE

6. LIVE TALK prompt
- Video mode: NONE

7. Live conversation begins
- Video mode: NONE

8. Darkness timer/autonomy phase
- Video mode: NONE

9. Flashlight scene starts
- Video mode: queue VID_FLASHLIGHT_ORIENT

10. Orientation and generator search
- Video mode: VID_FLASHLIGHT_ORIENT -> VID_FLASHLIGHT_SCAN_GENERATOR

11. Generator found, still overlay handoff
- Video mode: stop to still (no long-running clip)

12. Generator interaction gate
- Video mode: none unless micro-loop is required for continuity

13. Generator on
- Video mode: VID_GENERATOR_ON

14. Joker/first card interaction
- Video mode: VID_CARD1_PICKUP on interaction commit

15. Post-card glitch reveal
- Video mode: none; still + frontend overlay effect

16. Waterpark reveal and settle
- Video mode: VID_PARK_EXPLORE then still handoff

17. Park exploration branch
- Video mode: up to 1-3 short clips from VID_PARK_EXPLORE pattern or branch variants

18. Maintenance discovery
- Video mode: VID_MAINTENANCE_APPROACH

19. Maintenance entry end sequence
- Video mode: continuation of VID_MAINTENANCE_APPROACH branch clip

20. Final card objective branch
- Video mode: VID_FINAL_CARD_RESOLUTION

21. Session pacing envelope
- Video mode: governed by 60s phase timers and 15s silence nudge cadence

## Trigger and Timer Contract

15-second silence nudge rule:
- From Step 7 onward, every 15s of silence emits NPC/autoplay nudge behavior.
- Video playback may continue; nudges can trigger overlay text.

60-second auto-advance rule:
- From Step 8 onward, each interactive phase auto-commits progression at 60s if player does not act.
- Video queue should proceed without deadlocks in no-player mode.

Card interaction timeout rule:
- If card interaction is not confirmed by player click within 60s, auto-pick branch triggers the same video entry.

## Runtime Event Expectations (to align in SHOT_SCRIPT + types)

Required backend events for video orchestration:
- scene_video (existing)
- scene_image (existing)
- video_gen_started (existing in runtime path)
- overlay_text (planned new event for styled text animations)
- autoplay_advance (planned new event for deterministic timeout progression)

## Prompt Delta Requirements

1. Keep flashlight and generator clips tightly scoped to visibility constraints in darkness-first phases.
2. Ensure waterpark clips emphasize surreal perfection and liminal beauty, not only decay language.
3. Avoid clip language that implies external observer camera.

## Deprecation and Cleanup Staging

Do not remove in this step.
Flag for later cleanup sprint after migration validation:
- zone_tunnel_entry
- zone_tunnel_mid
- zone_merge
- zone_park_shallow
- zone_park_slides
- zone_park_deep

## Validation Checklist

1. Confirm no scene_video event before Step 9.
2. Confirm first clip is flashlight-oriented.
3. Confirm generator transition clips hand off to still correctly.
4. Confirm card interaction uses click path and timeout path.
5. Confirm park exploration can run with or without player.
6. Confirm maintenance and final-card clips resolve to good ending or game over without stalled state.
