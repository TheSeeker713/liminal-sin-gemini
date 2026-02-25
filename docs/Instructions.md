# INSTRUCTIONS.md — Player Experience Flow
## Onboarding, Interaction Design & Session Architecture
### Version 1.1 | Day 3 — February 25, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 | Gamemaster.md v1.1 | Characters.md v1.1
### Status: PRODUCTION CANON — Frontend UX specification

---

> *"There is no menu. There is no pause. There is no game over screen. There is only the tunnel, the voices, and you."*

---

## FIRST PRINCIPLES

LIMINAL SIN breaks every convention of traditional game UI deliberately:

- **No title screen.** The experience begins immediately.
- **No menu.** There are no options to select before play begins.
- **No pause.** The world does not stop because you stepped away.
- **No HUD** in the traditional sense — the only UI elements are organic to the fiction (Jason's cracked smart-glasses overlay, flickering hint text, the voicebox waveform).
- **No game over screen.** The experience degrades, shifts, or ends — it does not fail.

This is not an oversight. This is the design. The absence of menus is the first horror.

---

## PHASE 1: THE INTRO FMV (No Interaction — Pure Cinema)

**Duration:** 1 minute 30 seconds  
**Player input:** Disabled. Mic and webcam are initialized but not active. The player watches.  
**Overlay:** None. Clean cinematic. No cracks, no glitch, no HUD.

### What Plays
A scripted cinematic sequence covering:
1. Drone establishing shot — Las Vegas Strip at night, slow push toward Bally's sign
2. Exterior Bally's — late-night quiet, formally-dressed couple visible
3. Interior basement mall — Audrey's kiosk, flickering fluorescents, dead arcades
4. Escalators — the couple passes through the sealed gate. The group chases. The floor gives way.
5. The fall — screen crack overlay begins mid-fall, spiderweb fracture blooms across lower-right
6. The landing — Jason on concrete. Flood lights. Dark still water. Slides half-submerged. HUD flickers on.

**Transition:** Hard cut to black on landing impact. One beat of silence. Then: the static loop begins.

---

## PHASE 2: THE STATIC LOOP (Passive Interaction — Trust Initialization)

**Duration:** Indefinite — loops until player speaks  
**Player input:** Mic active. Webcam active. Game Master begins reading immediately.  
**Overlay:** Two hint texts fade in and out. Jason's cracked-glasses vignette active.

### What Plays
A looping 8–12 second FMV clip:
- Jason on the concrete floor of the chamber, breathing hard
- He scans his surroundings slowly — the flood lights, the water, the submerged slides
- His cracked HUD flickers. The inventory ghost icons pulse briefly and fade.
- He talks quietly to himself — not to the player, not yet

**Jason's self-talk audio (AI-generated, looping):**
- *"shit... what do I do..."*
- *"Audrey? Josh?"* — distant muffled responses in their voices, distorted
- *"okay. okay. I'm— I'm okay."* (he is not okay)

**Hint Overlay Sequence (fade in → hold → fade out → pause → repeat):**
```
Hint 1: "Talk to Jason with your voice"        // Lower-center of screen
Hint 2: "Mic + webcam ON for full immersion"   // Lower-right corner
```
Hints are in a thin, lo-fi monospace font — the aesthetic of a corrupted system message, not a tutorial card. They feel like the voicebox is displaying them, not a game UI.

**Game Master during loop:**
- Begins reading player_emotion from webcam immediately (silent observation)
- Writes initial emotional baseline to session.state
- Does NOT trigger any events yet — this is the calibration window
- If the player does not speak for 90 seconds: Jason grows more agitated. He stands, moves, checks equipment. The loop extends naturally without a hard timeout.

---

## PHASE 3: FIRST CONTACT (Trust Initialization — Critical Window)

**Trigger:** Player speaks for the first time  
**What happens:** The voicebox device in Jason's hand activates on its own. He stares at it.

### First Contact Sequence
1. Jason hears the player's voice coming from the voicebox. He did not press anything.
2. He is quiet for a moment. Then: *"...who is this?"*
3. The player's response determines the opening trust trajectory.
4. Jason reacts in real-time via Gemini Live API — his response is generated from his persona, not scripted.
5. After 3–5 successful exchanges (GM evaluates `player_intent` as cooperative), `trust_level` begins rising above 0.1.
6. Once `trust_level` crosses 0.3: Jason stops treating the voice as a threat and starts treating it as a resource. The game properly begins.

### Trust Initialization Guidelines (GM Internal)
| Player's Opening Approach | GM Classification | Starting trust_level |
|---|---|---|
| Calm, helpful, asks about the situation | `player_intent: cooperative` | 0.15 → rises quickly |
| Scared/panicked, lots of questions | `player_intent: distressed` | 0.10 → rises with reassurance |
| Joking, testing the system | `player_intent: testing` | 0.08 → Jason is cautious longer |
| Aggressive or commanding | `player_intent: commanding` | 0.05 → trust builds very slowly |
| Silent (player doesn't speak) | `player_intent: absent` | 0.00 → Jason waits, loop extends |

---

## PHASE 4: ACTIVE PLAY (Core Loop)

### The Core Interaction Loop
```
Player speaks
    → VAD detects speech end
    → GM reads player_emotion (webcam frame)
    → GM classifies player_intent (audio content)
    → GM routes voice to correct character agent(s) via proximity_state
    → Character agent generates response (Gemini 2.5 Flash Native Audio)
    → GM selects scene_key → FMV clip loads
    → Character audio plays synchronized with FMV
    → GM updates Firestore state
    → Loop waits for next player input
```

### Barge-In Protocol
The player can interrupt a character at any time. This is not a bug — it is a feature.

- While a character is speaking, the VAD detects new player audio
- Current TTS output halts immediately (native Gemini Live barge-in)
- Character registers the interruption in their persona (Jason may say "wait, what—", Josh may snap "I was talking")
- Player's new input is processed from the beginning of the pipeline
- Characters remember being interrupted — repeated interruptions lower `trust_level` slightly

### Relay Mechanic (Player as Communication Node)
Audrey and Josh cannot hear each other directly at ECHO/ISOLATED range. The player is the only bridge.

- Player can relay information: *"Josh says he's near water. Turn toward the sound."*
- Characters react to relayed information with appropriate skepticism or relief
- Relaying accurate information increases `trust_level` for both parties
- Relaying false information (intentionally or accidentally) decreases trust and may trigger character rebellion

### Gear Distribution (Voice Commands)
Items from Jason's backpack are accessible through natural dialogue:
- *"Jason, give Audrey the flashlight"* — Jason acknowledges, confirms the transfer, trust with Audrey increases
- *"Check your bag"* — Jason describes current backpack contents through cracked-glasses HUD narration
- *"Turn on the multimeter"* — Jason activates it, describes readings, potentially triggers Slotsky detection

---

## PHASE 5: FMV PLAYBACK ARCHITECTURE

### Pre-Generated Clip Library (30–50 clips, Act 1)
All FMV clips are pre-generated using the Morphic → Grok Imagine → Veo 3.1 pipeline.
They are organized in the library by `scene_key` and loaded by the GM's Firestore write.

**Clip categories:**
- `jason_reaction_*` — Jason's responses to player input (fear, relief, confusion, compliance, refusal)
- `jason_investigate_*` — Jason actively examining objects in the chamber
- `slotsky_anomaly_*` — Environmental events (cards appearing, lights flickering, geometry shifting)
- `audrey_distant_*` — Audrey's muffled voice sequences (requires action camera distributed)
- `josh_distant_*` — Josh's bravado/panic sequences (requires action camera distributed)
- `transition_*` — Scene transitions between chamber sub-zones
- `reunion_*` — FOUND state sequence

### Fallback Protocol (fmv_fallback_active)
If no matching clip exists and on-demand generation is in progress:
1. GM writes `fmv_fallback_active: true`
2. Frontend loads a **neutral loop clip** (Jason scanning the chamber)
3. Jason's audio layer (live Gemini) continues running — he talks, asks questions, buys time
4. Background generation completes within 10–15 seconds
5. When ready: GM writes new `scene_key`, frontend transitions to generated clip

---

## PHASE 6: SESSION END STATES

### Prototype Ending (Act 1 Conclusion)
Triggered when `proximity_state: FOUND` for all three characters.

1. All lights in the chamber cut out simultaneously — 8 seconds of near-total darkness
2. Jason's cracked HUD is the only light source — the inventory ghost icons pulse one final time
3. A sound rises from far below — water. Moving. Coming from the Nature Vault beneath them.
4. The three characters are together. They are quiet.
5. Fade to black.
6. A single line of text appears in the cracked-glasses font:

```
THE DESCENT CONTINUES
```

### Degraded Ending (Low Trust Collapse)
If all three `trust_level` values fall to 0.0 before FOUND state:
- Characters stop responding to the player
- The voicebox static grows until it overtakes the ambient audio
- Jason sets the voicebox down on the concrete
- The static loop resumes — but Jason is not looking at the camera anymore
- No text. No hint. The loop runs indefinitely.

---

## TECHNICAL SETUP REQUIREMENTS (Player-Facing)

The game requires and will prompt for:
- **Microphone access** — mandatory for all character interaction
- **Webcam access** — mandatory for Game Master emotional detection; characters do not see the player
- **Audio output** — headphones strongly recommended for spatial audio separation of character voices
- **Browser** — Chrome or Edge recommended for WebSocket + WebRTC stability

**Prompt copy (displayed before webcam/mic permission request):**
```
LIMINAL SIN uses your microphone and camera to create a live horror experience.
Your camera is used only to detect your emotional state and adjust pacing.
Characters cannot see you. Only the system can.
You will not be recorded. No footage is stored.
```

---

*INSTRUCTIONS.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Last Updated: Day 3 — February 25, 2026 | Version 1.1*
*Canon. Cross-reference WORLD_BIBLE.md v1.1 | Gamemaster.md v1.1*
