# SHOT_SCRIPT_PART2.md — Liminal Sin Act 1 Director's Blueprint (Phases 6–8)

## Version 3.0 | March 15, 2026

> Extracted from SHOT_SCRIPT.md. Covers Phases 6 through 8 (waterpark entrance through endings).
> For Phases 1–5B, see [SHOT_SCRIPT.md](SHOT_SCRIPT.md).

---

## PHASE 6 — WATERPARK ENTRANCE

**[Beat 4 — Paradise Reveal]**

**Trigger:** Plays immediately after WILDCARD 1 resolves.

**Tunnel Transition — `tunnel_transition_01` (15s, has baked sound — DO NOT MUTE):**

- White CSS animated #FFFFFF fade INTO this scene. No glitch effects, no scare SFX. Clean fade. This is a break from the scare.
- At 0s — Jason should react to being somewhere else. Still in a tunnel, but he was just by a generator a moment earlier.
- At 8s — Jason should react to the waterpark to the right of the tunnel. He is confused and surprised.
- Clip ends → `park_reveal_01` plays immediately.

**Park Reveal — `park_reveal_01` (15s, has baked sound — DO NOT MUTE):**

- No timed or keyword triggers in this scene.
- At 9s — full screen CSS animated glitch and noise effect for 1s, then gone.
- At 13s and continuing — Jason describes blue, yellow, orange and green slides to the left, a shallow pool in front of him.
- Player can talk to Jason and Jason will respond with live agent audio.
- Clip ends → `park_walkway_01` plays immediately.

**Screen:** The sequence moves through two continuity beats:

- `tunnel_to_park_transition`: still in the Boring tunnel, pushing toward the impossible opening, then the waterpark appears
- `park_transition_reveal`: the full reveal of the functional underground waterpark

**SFX:**

- `[SFX: generator_start]` — industrial generator spool-up, 4 seconds, fires on scene transition
- `[SFX: neon_hum]` — faint electrical neon hum, low, continuous under this phase
- `[SFX: drip_loop]` — continues but shifts register (now mixed with the neon environment)

---

## PHASE 6B — WATERPARK INTERIOR

**[Beat 5 — Scale Reveal / Liminal Transition]**

**Trigger:** Plays immediately after `park_reveal_01` ends.

**Park Walkway 1 — `park_walkway_01` (10s, has baked sound — DO NOT MUTE):**

- Continues immediately after park reveal.
- At 5s — Jason should react to the hangar-like ceiling above.
- At 9s and continuing — Jason should react to the ceiling going dark.
- Clip ends → `park_walkway_02` plays immediately.

**Park Walkway 2 — `park_walkway_02` (15s, no baked sound):**

- Continues immediately after park_walkway_01.
- At 3s — Jason should notice a manmade cave to the right. He's going to check it out.
- Water fountain SFX. Walking on wet concrete SFX.
- Clip ends → `park_liminal_01` plays immediately.

**Park Liminal — `park_liminal_01` (15s, no baked sound):**

- Continues immediately after park_walkway_02.
- At 7s — Jason should react to the water park changing in front of him.
- At 13s through to the still frame — Jason describes the slides changed colors. The shallow pool is gone. There is a pool that looks like a lazy river but it is not. Jason is confused and a little scared.
- Clip ends → `park_liminal_01.png` still.

**Park Liminal Still (`park_liminal_01.png`):** Still image extracted from `park_liminal_01` clip. Time TRIGGERED and KEYWORD TRIGGERED. Player must use keywords like "look around" to trigger the next scene. Auto-advances after timeout.

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_walkway`
- `[SFX: neon_hum]` — continues
- `[SFX: waterfall_ambient]` — begins here; vast, low-register cascade sound

---

## PHASE 6C — MAINTENANCE DISCOVERY

**[Beat 5C — Decision point]**

**Trigger:** Player says "look around" or timeout triggers from `park_liminal_01.png` still.

**Maintenance Reveal — `maintenance_reveal_01` (15s, no baked sound):**

- At 9s — Jason reacts to environment changes again. This time there is a building.
- At 13s — Jason notices what looks like a maintenance shaft where the cave was before. He decides to investigate.
- Clip ends → `shaft_maintenance_01` plays immediately.

**Maintenance Shaft — `shaft_maintenance_01` (10s, no baked sound):**

- At 5s — a secret entrance opens up, Jason reacts and notices an elevator inside.
- At 9s — Jason decides to get in the elevator. He talks about it and how this is getting really weird.
- Clip ends → `elevator_entry_01.png` still.

**Elevator Reveal (`elevator_entry_01.png`):** Still image extracted from `shaft_maintenance_01` clip. Time TRIGGERED and KEYWORD TRIGGERED. Player must use keywords like "go in" to trigger the next scene. Auto-advances after timeout.

**SFX:**

- `[SFX: glitch_low]` — fires on scene transition to `park_shaft_view`
- `[SFX: waterfall_ambient]` — fades slightly as industrial sounds begin to intrude from the maintenance zone

---

## PHASE 7 — ELEVATOR DESCENT & MAINTENANCE CORRIDOR

**[Beat 6 — Descent and approach]**

**Trigger:** Player says "go in" or timeout triggers from `elevator_entry_01.png` still.

**Elevator Ride — `elevator_entry_01` (15s, no baked sound):**

- At 0s — Jason walks up to the elevator door.
- At 7s — Jason reacts to the elevator door opening.
- At 11s — steps inside.
- Clip ends → `elevator_inside_01` plays immediately.

**Inside Elevator — `elevator_inside_01` (5s, no baked sound):**

- At 0s — Jason reacts to the elevator going down immediately.
- At 4s — elevator door starts to open up.
- Clip ends → `elevator_inside_02` plays immediately.

**Inside Elevator 2 — `elevator_inside_02` (15s, has baked sound — DO NOT MUTE):**

- At 4s — the elevator door opened all the way. A 2s full screen CSS glitch and noise should occur here and end.
- At 6s — Jason is walking in the hallway.
- Clip ends → `hallway_pov_01` plays immediately.

**Hallway POV — `hallway_pov_01` (10s, has baked sound — DO NOT MUTE):**

- At 0s — Jason continues walking down the hallway.
- Clip ends → `hallway_pov_02.png` still.

(All scripted scenes — backend serves Morphic files from GCS. No live Imagen/Veo generation.)

**Scene Transition SFX:**

- `[SFX: glitch_low]` — fires on each scene transition through this phase
- `[SFX: waterfall_ambient]` — fades out completely as elevator closes
- `[SFX: metal_hum]` — low industrial drone, begins in elevator

**Wildcard prewarm (background):**

- At `hallway_pov_02_ready` signal from frontend, backend begins background pre-generation of both `wildcard_game_over` and `wildcard_good_ending` branches.
- Backend re-attempts both at +90s as a safety pass.

---

## PHASE 7B — HALLWAY DEEP PUSH: ACECARD KEYWORD GATE

**[Beat 7 — Terminal node / two-outcome gate]**

**Trigger:** Autoplay advance brings Jason to `hallway_pov_02`. Backend immediately fires `acecard_keyword_timer_start` (30s, invisible).

**Screen:** `hallway_pov_02.png` still (no `.mp4` for this media). Gameplay holds on this image for the duration of the keyword window.

**⚠️ VISUAL HINT REQUIRED (per LS_VIDEO_PIPELINE step 23):** The panel is hidden and the player will not likely know to look for it. Jason must give the player a hint, AND there should be a visual text hint that fades in and out to help the player discover the trigger. The hint should be subtle, like "Maybe there's a panel somewhere?" or "I wonder if I can interact with anything here?". **The hint should appear immediately** because this is a Game Over scene event — the player has limited time.

**Backend on step 31 entry:**

- Sends `acecard_keyword_timer_start` → frontend (`{ payload: { durationMs: 30000 } }`)
- Starts invisible 30s `acecardKeywordTimer` — fires `wildcard_game_over` pipeline on expiry
- Wildcard prewarm continues in background (started at `hallway_pov_02_ready`)

**Keyword window — 30 seconds, invisible (no UI indicator):**

- Player must give Jason any instruction to grab, take, pick up, or retrieve an object
- Any semantically broad acquire/retrieve instruction counts — e.g. "grab it", "take the card", "get it", "pick it up", "there — take that", "Jason grab the card"
- GM detects the instruction → calls `triggerAcecardReveal()`

**SFX during keyword window (frontend-driven):**

- 0–10s: `[SFX: heartbeat_low]` — barely audible, slow pulse
- 10–20s: `[SFX: heartbeat_mid]` — louder, slightly faster
- 20–30s: `[SFX: heartbeat_high1]` + `[SFX: heartbeat_high2]` + `[SFX: distant_growl1]` + `[SFX: distant_growl2]` — urgent pressure, rising

**ON KEYWORD DETECTED (before 30s expiry):**

- Backend clears `acecardKeywordTimer` → sends `acecard_reveal_start { payload: { mediaId: "acecard_reveal_01" } }`
- Frontend plays `acecard_reveal_01.mp4` (15s, has baked sound — DO NOT MUTE). At 6.5s Jason notices his clothes have changed to a leather jacket — he is freaking out. At 12s Jason sees another card — an Ace card.
- Clip ends → frontend sends `acecard_reveal_complete` to backend
- Backend sends `card_pickup_02_ready { payload: { mediaId: "card_pickup_02", durationMs: 15000 } }`
- Frontend displays `card_pickup_02.png` still; floating **Ace Card** overlay appears
- 15-second invisible countdown begins (SFX escalation continues)
- Player clicks overlay **OR** voice-commands Jason to grab it → `card_collected({ cardId: "card2" })` → routes to Phase 8 (good ending)
- 15s expires without collection → `wildcard_game_over` pipeline → game over

**ON KEYWORD TIMER EXPIRY (30s, no instruction given):**

- Backend fires `wildcard_game_over` pipeline → `game_over`
- Step 31 is a terminal advance node — no further autoplay advance from here under any path.

---

### GAME OVER BRANCH (timer expires before Card 2 collected)

**Trigger:** Backend dread timer reaches 0 — routes through `emitWildcardGameOverBranch()` in `server.ts`.

**WILDCARD 2 / Game Over (per LS_VIDEO_PIPELINE):** This is a game over sequence — NOT generated video. It uses a series of SFX, glitch overlays, and CSS animation. About 8 seconds long.

1. `slotsky_trigger({ anomalyType: "wildcard_game_over_loading" })` — frontend starts CSS glitch loop.
2. `slotsky_trigger({ anomalyType: "wildcard_game_over_start" })` — SFX/glitch sequence begins.
3. After ~8s: backend sends `game_over`.
4. Game over screen fades in (white on black, centered):

   ```
   GAME OVER.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```

5. Frontend presents `[PLAY AGAIN]` and `[QUIT GAME]`.
   - **PLAY AGAIN** → restarts the game from the beginning.
   - **QUIT GAME** → returns Player to `/ls` page.

---

## PHASE 8 — THE ENDING (Card 2 Found)

**[Beat 8 — "To Be Continued"]**

**Trigger:** Frontend sends `card_collected({ cardId: 'card2' })` to backend.

**Card Pickup 2 — `card_pickup_02` (7s, has baked sound — DO NOT MUTE):**

- Plays when the player triggers keywords like "pick up the card" or clicks the floating card icon after the acecard reveal.
- Clip shows Jason picking up the Ace card.
- Clip end triggers **WILDCARD 3**.

**Backend flow (in order):**

1. `card_collected('card2')` → backend cancels dread timer
2. `queueWildcardGoodEndingPlayback()` fires in `server.ts`
3. `slotsky_trigger({ anomalyType: "wildcard_good_ending_loading" })` — frontend starts CSS glitch loop
4. `wildcard3_trigger({ sceneKey: "wildcard_good_ending" })` — frontend glitch transition treatment
5. `wildcard_good_ending` scene_image + scene_video served (live Imagen+Veo generation)
6. After 8s playback: backend sends `good_ending`

**WILDCARD 3 / Good Ending (8s, live-generated):** Uses Veo 3.1 video generation. The clip ends with a serene CSS glow effect, peaceful SFX, and triggers the good ending screen.

`found_transition` is a cosmetic Slotsky pulse, NOT the ending trigger.

**No close-up and no detached insert.** The ending remains Jason POV throughout.

**Audrey's voice (trust-adaptive):**
Note: Jason's trust score is the only input to Audrey's dialogue. Fear index has no impact. Audrey is triggered by `server.ts` during the `wildcard_good_ending` playback (not by GM function call).
| Trust | Audrey's line |
|---|---|
| ≥ 0.7 (High) | _"Jason?"_ — soft, hopeful, as if she just heard something. She says his name. |
| 0.4–0.69 (Neutral) | One short sentence, muffled and echoing. Scared but present. |
| < 0.4 (Low) | Quiet crying. No name. A single exhale of despair. She sounds very far away. |

**SFX:**

- static feedback after the card click glitch
- Jason's running footsteps bridging into the reopened waterpark scene
- Audrey's voice over the reopened park space

**Screen transition:**

1. Waterpark scene reopens after static feedback.
2. Audrey's voice is heard.
3. Fade to black.
4. Text appears (white on black, centered):

   ```
   TO BE CONTINUED.

   THANK YOU FOR PLAYING LIMINAL SIN.
   ```

5. Frontend presents `[PLAY AGAIN]` and `[QUIT GAME]`.
   - **PLAY AGAIN** → restarts the game from the beginning.
   - **QUIT GAME** → returns Player to `/ls` page.

**Jason (optional closing line — free character choice):**

- He goes quiet as the smartglasses app signal fades to static.
- He may say nothing. Or: _"...I'll find them."_
- His choice, in character.

---

_SHOT_SCRIPT_PART2.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 3.0 | March 15, 2026_
_Canon. Cross-reference: SHOT_SCRIPT.md | WS_EVENTS.md | LS_VIDEO_PIPELINE.md | AGENTS.md_
