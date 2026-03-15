Authoritative video pipeline reference for Liminal Sin Act 1. Defines all 28 media steps — pre-rendered clips, stills, wildcards — with per-clip SFX/audio cues, trigger types, durations, and GCS bucket paths. Supersedes any conflicting media specs in SHOT_SCRIPT.md or SHOT_STEPS.md.

---

# Liminal Sin Video Pipeline Documentation


This project demo only covers ACT 1: the descent into the generator shaft. The video pipeline for ACT 1 is as follows:

1. **Title and Credits**: This should only be about 15 seconds of CSS animations and text overlays. No video rendering required.

2. **Jason's fall impact and darkness**: This is a live agent audio experience with a static black screen. No video rendering required. This should last between 15 and 30 seconds.

3. **Flashlight sweep**: flashlight_sweep_01 | 10s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/flashlight_sweep_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS the keyword "flashlight". 

4. **Tunnel Flashlight**: tunnel_flashlight_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/tunnel_flashlight_01.mp4` - This is a pre-rendered clip that plays immediately after the flashlight sweep.

5. **Tunnel Generator**: tunnel_generator_01 | 10s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/tunnel_generator_01.mp4` - This is a pre-rendered clip that plays immediately after the tunnel flashlight.

6. **Tunnel Generator Idle**: tunnel_generator_01.png | Still image extracted from the tunnel_generator_01 clip. This still is both time TRIGGERED and KEYWORD TRIGGERED. The player must use keywords like "turn on the generator" to trigger the next clip, but if they fail to do so, the still will automatically trigger after a timeout to advance the scene.

7. **Joker Card Reveal**: card_joker_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/card_joker_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS the keywords like "turn on the generator". The clip name seems misleading but the video clip contains two parts: the first part shows JASON turning on the generator, and the second part JASON looks down and sees the Joker card. The card overlay must appear at the end of this clip, triggered by a WS event from the backend. The player can only pick up the card after the reveal clip finishes and the overlay appears.

8. **Joker Card Idle**: card_joker_01.png | Still image extracted from the card_joker_01 clip. This still is both time TRIGGERED, KEYWORD TRIGGERED, and CARD ICON CLICK TRIGGERED. The player must use keywords like "pick up the card" to trigger the next scene, or CLICK on a floating card icon, but if they fail to do so, the still will automatically trigger after a timeout to advance the scene. 

9. **Card Pickup**: card_pickup_01 | 6s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/card_pickup_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS the keywords like "pick up the card" or clicks on the floating card icon. The clip shows JASON picking up the Joker card and should trigger WILDCARD1.

10. **Wildcard 1**: This is a live-generated clip that plays when the player picks up the Joker card. This is a Live Agent-powered scene that uses the Player's webcam feed as input, captures a single frame of the Player and the environment, then applies the jpg image to a Veo3.1 video generation on Google cloud. The video generation applies a shadowy figure in the background behind the player, also the player is and the environment is animated with live action webcam quality movement. There is a frontend SFX scare when the figure first appears. The clip is only 8 seconds. The end of clip must end with heavy CSS glitch effects and a loud SFX scare, then it should trigger the next scene.

11. **Tunnel Transition**: tunnel_transition_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/tunnel_transition_01.mp4` - This is a pre-rendered clip that plays immediately after the wildcard scare. The clip should have a white CSS animated #FFFFFF fade into the scene. no glitch effects, no scare SFX. Just a clean fade into this scene. This is a break from the scare. Jason now sees something that shouldn't be there. A waterpark connecting to the Boring tunnel. This clip ends with park_reveal_01.mp4 playing.

12. **Park Reveal**: park_reveal_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/park_reveal_01.mp4` - This is a pre-rendered clip that plays immediately after the tunnel transition. There are no timed or keyword triggers in this scene. The player can however, talk to Jason and Jason will respond with live agent audio, this contines with two more clips. park_walkway_01 and park_walkway_02. 

13. **Park Walkway 1**: park_walkway_01 | 10s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/park_walkway_01.mp4` - This is a pre-rendered clip that continues immediately after the park reveal. park_walkway_02 continues immediately after park_walkway_01.

14. **Park Walkway 2**: park_walkway_02 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/park_walkway_02.mp4` - This is a pre-rendered clip that continues immediately after park_walkway_01. This clip ends with park_liminal_01.mp4 playing.

14a. **Park Liminal**: park_liminal_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/park_liminal_01.mp4` - This is a pre-rendered clip that continues immediately after park_walkway_02. This clip ends with a still.

15. **Park Walkway Still**: park_liminal_01.png  | Still image extracted from the park_walkway_02 clip. This still is time TRIGGERED and KEYWORD TRIGGERED. The player must use keywords like "look around" to trigger the next scene, but if they fail to do so, the still will automatically trigger after a timeout to advance the scene.

16. **Maintenance Reveal**: maintenance_reveal_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/maintenance_reveal_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS keywords like "look around". Clip ends with Jason seeing a maintenance shaft. This clip ends with shaft_maintenance_01.mp4 playing.

17. **Maintenance Shaft**: shaft_maintenance_01 | 10s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/maintenance_shaft_01.mp4` - This is a pre-rendered clip that plays immediately after the maintenance reveal. This clip ends with Jason seeing an elevator. This clip ends with a still.

18. **Elevator Reveal**: elevator_entry_01.png | Still image extracted from the shaft_maintenance_01 clip. This still is time TRIGGERED and KEYWORD TRIGGERED. The player must use keywords like "go in" to trigger the next scene, but if they fail to do so, the still will automatically trigger after a timeout to advance the scene.

19. **Elevator Ride**: elevator_entry_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/elevator_entry_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS keywords like "go in". This clip ends with elevator_inside_01.mp4 playing.

20. **Inside Elevator**: elevator_inside_01 | 5s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/elevator_inside_01.mp4` - This is a pre-rendered clip that plays immediately after the elevator reveal. This clip ends with elevator_inside_02.mp4 playing.

21. **Inside Elevator 2**: elevator_inside_02 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/elevator_inside_02.mp4` - This is a pre-rendered clip that plays immediately after the inside elevator. This clip ends with Jason inside the hallway and should trigger the hallway_pov_01.mp4 clip.

22. **Hallway POV**: hallway_pov_01 | 10s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/hallway_pov_01.mp4` - This is a pre-rendered clip that plays immediately after the inside elevator 2. This clip ends with a still.

23. **Hallway POV Still**: hallway_pov_02.png | Still image extracted from the hallway_pov_01 clip. This still is time TRIGGERED and KEYWORD TRIGGERED. The player must use keywords like "panel" to trigger the next scene, but if they fail to do so, the still will automatically trigger after a timeout to advance the scene. note: the panel is hidden and the Player will not likely know to look for it, so JASON must give the player a hint, and there should be a visual text hint fade in and out to help the player discover the trigger. The hint be subtle, like "Maybe there's a panel somewhere?" or "I wonder if I can interact with anything here?" The hint should appear immediately because this is a Game Over scene event.
If the timer runs out. WILDCARD2 is triggered. This is a game over sequence not with generated video but with a series of SFX and glitch overlays, and animation.

24. **Card Reveal**: acecard_reveal_01 | 15s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/acecard_reveal_01.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS keywords like "panel". The clip shows Jason discovering the Acecard, which is the second and final card in Act 1. The clip should end with a reveal of the Acecard.

25. **Card Pickup**: card_pickup_02.png | Still image extracted from the acecard_reveal_01 clip. This still is both time TRIGGERED, KEYWORD TRIGGERED, and CARD ICON CLICK TRIGGERED. The player must use keywords like "pick up the card" to trigger the next scene, or CLICK on a floating card icon, but if they fail to do so, the still will automatically trigger after a timeout and trigger WILDCARD2, the game over sequence.

26. **Wildcard 2 / Game Over**: This is a game over sequence not with generated video but with a series of SFX and glitch overlays, and animation. This is triggered when the player fails to pick up the Acecard in time, or if they trigger the wildcard 2 directly from the hallway_pov_02 timeout. The sequence should be about 8 seconds long, and it should end with a game over screen that prompts the player to "Play Again", or "QUIT GAME", which restarts the game from the beginning. or returns Player to /ls page.

27. **Card Pickup**: card_pickup_02 | 7s | 1080p | 5Mbps | MP4 (H.264) | GCS bucket `liminal-sin-assets/clips/card_pickup_02.mp4` - This is a pre-rendered clip that plays when the player TRIGGERS the keywords like "pick up the card" or clicks on the floating card icon after the acecard reveal. The clip shows JASON picking up the Acecard and should trigger WILDCARD3, which is the good ending sequence for Act 1.

28. **Wildcard 3 / Good Ending**: This is a live-generated clip that plays when the player picks up the Acecard. This is a Live Agent-powered scene that uses a Veo3.1 video generation on Google cloud. The clip is only 8 seconds. The end of clip must end with a serene CSS glow effect, peaceful SFX, and it should trigger the good ending screen with a "Play Again" or "QUIT GAME" prompt.

---

NOTE: There is too much radio static SFX when the player talks and when Jason talks. It is also too loud. Either lower the volume for the specific static SFX, or reduce the frequency of them being triggered.

---

flashlight_sweep_01     | 10s | (this is the only clip that should be muted - all other clips must have sound) | Jason should talk - "the wall says Boring, but this is far from boring" | The Player should be allowed to interrupt Jason during the entire game. | Walking SFX should play during the entire clip | Ambient sounds should play |

---

tunnel_flashlight_01    | 15s | This clip has no sound | at 3s - walking SFX should start | at 7s - Jason should react to a white generator moving on it's own towards him | at 12s - stop walking SFX |
---
tunnel_generator_01     | 10s | This clip has no sound | at 1.5s - walking SFX should start | at 6s - Jason should notice name change on the wall to Bard | stop walking SFX at 10s or end or clip |
---
card_joker_01           | 15s | This clip has no sound | at 5s - Jason should say "im turning it on now" | at 9s - the flashligh CSS overlay should be removed permanantly from the rest of the game | at 13s - Jason should react to the Joker Card on the ground |
---
card_pickup_01          | 6s  | This clip has no sound | ambient sounds should play | at 0s - Jason should say, "okay, i'm picking it up now" |
---
tunnel_transition_01    | 15s | This clip has sound - DO NOT MUTE | at 0s - Jason should react to being somewhere else. still in a tunnel, but he was just by a generator a moment earlier | at 8s - Should react to the waterpark to the right of the tunnel. He is confused and surprised. | 
---
park_reveal_01          | 15s | This clip has sound - DO NOT MUTE | at 9s - there needs to be a full screen css animated glitch and noise effect for 1s then gone. | At 13s and continuing through the park_reveal_01 clip Jason describes blue, yellow, orange and green slides to the left. a shallow pool in front of him. |
---
park_walkway_01         | 10s | This clip has sound - DO NOT MUTE | at 5s - Jason should react to the hanger like ceiling above |  at 9s and continue through park_walkway_01 - jason should react to the ceiling going dark. |
---
park_walkway_02         | 15s | This clip has no sound | at 3s - Jason should notice a manmade cave to the right. He's going to check it out. | water fountain SFX | walking on wet concrete sfx | 
---
park_liminal_01         | 15s | This clip has no sound | at 7s - Jason should react to the water park changing in front of him |  at 13s through to the still frame - Jason describes the slides changed colors. the shallow pool is gone. there is pool that looks like a lazy river but it is not. Jason is confused and a little scared. |
---
maintenance_reveal_01   | 15s | This clip has no sound | at 9s - Jason react to environment changes again. This time there is a building | at 13s - Jason notices what looks like a maintenance shaft where the cave was before. he decides to investigate. |
---
shaft_maintenance_01    | 10s | This clip has no sound | at 5s - a secret entrance opens up, jason reacts and notices an elevator inside | at 9s - Jason decides to get in the elevator | He talks about it and how this is getting really weird. |
---
elevator_entry_01       | 15s | This clip has no sound | 0s - Jason walks up to the elevator door | at 7s - Jason reacts to the elevator door opening | at 11s -  steps inside | 
---
elevator_inside_01      | 5s  | This clip has no sound | 0s - Jason reacts to the elevator going down immediately | at 4s - elevator door starts to open up. |
---
elevator_inside_02      | 15s | This clip has sound - DO NOT MUTE | at 4s the elevator door opened all the way, A 2s full screen CSS glitch and noise should occur here and end. | at 6s - Jason is walking in the hallway. |

hallway_pov_01          | 10s | This clip has sound - DO NOT MUTE | 0s - Jason continues walking down the hallway |  
---
acecard_reveal_01       | 15s | This clip has sound - DO NOT MUTE | at 6.5s - Jason notices his clothes have changed to a leather jacket. he is freaking out. | at 12s - Jason sees another card. An ACE card |
---
card_pickup_02          | 7s  | This clip has sound - DO NOT MUTE | 