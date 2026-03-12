# PROMPT_QUEUE_SEQUENCE.md - Act 1 Canonical Sequence

Status: Draft v1 (implementation source)
Date: March 12, 2026
Scope: Act 1 only

Purpose:
- Define the exact sequential queue for image/video/text behavior.
- Bind each narrative step to trigger mode, media mode, and timer logic.
- Make idle autoplay behavior deterministic when player input is absent.

Authority:
- This document is co-authoritative with SHOT_SCRIPT for sequence execution.
- If a required behavior is missing in SHOT_SCRIPT, SHOT_SCRIPT must be updated.

## Global Runtime Rules

1. No visual scene generation before flashlight trigger.
2. Steps 1-4 are black screen only.
3. Mic and camera remain blocked until Step 5.
4. LIVE AI text "TALK" appears at Step 6.
5. From Step 7 onward:
	 - NPC silence nudge every 15 seconds of no player speech.
	 - Auto-advance every 60 seconds if player is inactive.
6. If player remains inactive, session continues as linear autoplay and can end good or bad.

## Prompt Queue IDs

Image queue IDs (existing scene keys):
- IMG_FLASHLIGHT_BEAM -> flashlight_beam
- IMG_GENERATOR_AREA -> generator_area
- IMG_PARK_SHORE -> zone_park_shore
- IMG_MAINTENANCE -> maintenance_area
- IMG_SLOTSKY_CARD -> slotsky_card
- IMG_CARD2_CLOSEUP -> card2_closeup

Video queue IDs (existing scene keys):
- VID_FLASHLIGHT_ORIENT -> flashlight_beam
- VID_FLASHLIGHT_SCAN_GENERATOR -> generator_area
- VID_GENERATOR_ON -> zone_park_shore
- VID_CARD1_PICKUP -> generator_area
- VID_PARK_EXPLORE -> zone_park_shore
- VID_MAINTENANCE_APPROACH -> maintenance_area

Text/overlay queue IDs (new runtime overlays):
- TXT_TALK_PROMPT
- TXT_IDLE_NUDGE_SOFT
- TXT_IDLE_NUDGE_URGENT
- TXT_CARD_INTERACT
- TXT_GLITCH_VISION_FLASH

## Canonical Step Queue (1-21)

1. Falling down
- Trigger: session start
- Media: black screen + impact audio only
- Input gates: mic OFF, camera OFF
- Notes: no scene image, no video

2. Landing
- Trigger: immediately after Step 1
- Media: black screen + pain/recovery audio + Jason vocal performance
- Input gates: mic OFF, camera OFF
- Notes: Jason injured, disoriented, no visual claims

3. No-vision constraint
- Trigger: Step 2 continuation
- Media: black screen only
- Input gates: mic OFF, camera OFF
- NPC rule: Jason cannot mention slides, tunnel details, or maintenance visibility

4. Pre-mic Jason live monologue
- Trigger: Step 3 continuation
- Media: black screen + live NPC dialogue
- Input gates: mic OFF, camera OFF
- NPC rule: calls for Audrey and Josh; no environmental visibility claims

5. Input enable gate
- Trigger: end of Step 4
- Media: black screen
- Input gates: mic ON, camera ON (first enable point)

6. TALK prompt appears
- Trigger: immediate after Step 5
- Media: live text overlay (TXT_TALK_PROMPT)
- Input gates: mic ON, camera ON
- Notes: remove prescripted prompt text, use live AI styled output

7. Live conversation state
- Trigger: Step 6 completion
- Media: live Jason/player interruption-enabled dialogue
- UI: trust and fear meters become visible
- Timer rules start: 15s nudge loop + 60s autoplay loop

8. Darkness timer behavior
- Trigger: Step 7 active window
- Media: black screen still
- Timer: 60s to flashlight instruction
- Branch:
	- If player says flashlight command -> Step 9
	- Else Jason autonomously advances -> Step 9

9. Flashlight scene starts
- Trigger: flashlight command or 60s auto-advance
- Media: scene change to IMG_FLASHLIGHT_BEAM

10. Flashlight exploration video phase
- Trigger: Step 9 completion
- Media: two video intents in sequence
	- VID_FLASHLIGHT_ORIENT (get bearings)
	- VID_FLASHLIGHT_SCAN_GENERATOR (seek generator)

11. Generator still with animated overlay
- Trigger: generator found
- Media: transition from video to still IMG_GENERATOR_AREA
- Overlay: frontend animated overlay while flashlight motion continues over still

12. Generator interaction gate
- Trigger: Step 11
- Media: live dialogue + overlay hint
- Timer: 60s
- Branch:
	- Player instructs generator on -> Step 13
	- No player input -> Jason auto-acts -> Step 13

13. Generator turns on
- Trigger: player or auto
- Media: VID_GENERATOR_ON

14. Joker card pickup branch
- Trigger: generator on state
- Media: card overlay + VID_CARD1_PICKUP only on collect moment
- Timer: 60s
- Branch:
	- Player clicks card overlay -> pickup video
	- Timeout -> Jason auto-picks and same pickup video
- Nudge loop: every 15s if no speech

15. Post-card glitch reveal
- Trigger: card pickup complete
- Media: still frame + glitch overlay + brief player-image warp
- Jason behavior:
	- Describes player as confused vision flash
	- If camera unavailable, executes temporary fourth-wall line about smartglasses feed
	- If player provided name, use stored name
	- Else assign nickname and persist

16. Waterpark reveal video to still
- Trigger: Step 15 completion
- Media: VID_PARK_EXPLORE then still IMG_PARK_SHORE
- Canon: waterpark is functional, liminal paradise; not ruined framing

17. Park exploration branch
- Trigger: Step 16
- Media: 1-3 shot cycle (still+video combinations) before maintenance discovery
- Timer: 60s per decision window
- Branch:
	- Player directs search -> faster branch
	- Inactive -> Jason impatience auto-advances

18. Maintenance discovery with distant female voice
- Trigger: maintenance located
- Media: IMG_MAINTENANCE or VID_MAINTENANCE_APPROACH + distant female voice cue

19. Maintenance entry starts end sequence
- Trigger: player or auto choice to proceed
- Media: transition sequence into end branch state

20. Final card objective and ending branch
- Trigger: maintenance end state
- Media: uncover/move interaction + final card overlay + timer
- Branch:
	- Card collected in time -> good ending
	- Timeout -> game over
	- No player input -> Jason random choice resolves branch

21. Session pacing and autoplay envelope
- Rule: every post-TALK sequence uses a 60s progression timer
- Rule: every silence window emits 15s NPC nudge cycles
- Target runtime:
	- Fast informed run: 3-4 minutes
	- Passive run: longer linear autoplay, still guaranteed termination

## Required SHOT_SCRIPT Parity Updates (tracking)

1. Add explicit darkness-only Steps 1-4 with no visual generation.
2. Add hard input gate declaration: mic/camera off until Step 5.
3. Add live styled TALK overlay behavior at Step 6.
4. Add 15-second silence nudge loop after TALK.
5. Add 60-second auto-advance loop for each post-TALK phase.
6. Add card timeout auto-pick behavior and passive autoplay ending resolution.
7. Add explicit functional-paradise language for waterpark sequence descriptions.

## Deprecation Staging (do not delete in this step)

Mark legacy/fallback keys for later cleanup sprint:
- zone_tunnel_entry
- zone_tunnel_mid
- zone_merge
- zone_park_shallow
- zone_park_slides
- zone_park_deep

