# INSTRUCTIONS.md — Player Experience Flow
## Onboarding, Interaction Design & Session Architecture
### Version 1.1 | Day 3 — February 25, 2026
### Cross-reference: WORLD_BIBLE.md v1.1 | Gamemaster.md v1.1 | Characters.md v1.1
### Status: PRODUCTION CANON — Frontend UX specification

---

## DEMO SCOPE — ACTIVE (March 7–11, 2026)

> ⚠️ **Contest demo uses a simplified phase flow. The full FMV pipeline is deferred to roadmap.**

| Phase | Demo Status | Notes |
|---|---|---|
| **Phase 1: Intro FMV** | ⛔ REPLACED | Demo uses Imagen 3 static background + ambient audio. No 90s FMV cinematic. |
| **Phase 2: Static Loop** | ⛔ REPLACED | Demo uses Imagen 3 background + Jason echo audio loop (Gemini Live). |
| **Phase 3: First Contact** | ✅ ACTIVE | Unchanged. `"...who is this?"` — perfect as-is. |
| **Phase 4: Active Play** | ✅ ACTIVE (modified) | Core loop active. FMV clip load replaced by Imagen 3 background generation. |
| **Phase 5: FMV Playback** | ⛔ DEFERRED | Entire clip library approach deferred. See ROADMAP section at end of document. |
| **Phase 6: Session End** | ✅ ACTIVE (modified) | HUD/glasses overlay deferred; CSS glitch effect used instead. |
| **Smart glasses HUD** | ⛔ DEFERRED | Frontend overlay layer not built for demo. |
| **Backpack / gear** | ⛔ DEFERRED | All gear distribution dialogue deferred. Not in Jason’s demo prompt. |

---

> *"There is no menu. There is no pause. There is no game over screen. There is only the tunnel, the voices, and you."*

---

## FIRST PRINCIPLES

LIMINAL SIN breaks every convention of traditional game UI deliberately:

- **No title screen.** The experience begins immediately.
- **No menu.** There are no options to select before play begins.
- **No pause.** The world does not stop because you stepped away.
- **No HUD** in the traditional sense — the only UI elements are organic to the fiction (flickering hint text, the voicebox waveform). The CSS atmosphere layer provides glitch + vignette effects. ⚠️ **DEMO NOTE:** Jason’s cracked smart-glasses overlay requires a glasses HUD frontend implementation — deferred to roadmap.
- **No game over screen.** The experience degrades, shifts, or ends — it does not fail.

This is not an oversight. This is the design. The absence of menus is the first horror.

---

## DEMO: PHASE 1 — ATMOSPHERIC COLD OPEN

**Duration:** 5–10 seconds (immediate)
**Player input:** Disabled. Mic and webcam initialized but not active.
**Visual:** Imagen 3-generated background loads — canonical tunnel+waterpark composite (see `docs/Tunnel-and-park.md` prompt set). CSS vignette + grain overlay active.
**Audio:** Ambient loop begins — distant dripping, low construction hum, barely-audible distorted slot machine echo.

The experience opens directly into the chamber. No preamble. The first frame is the horror.

**Transition:** 2-second fade-in from black, then Phase 2 begins.

---

## ⛔ ROADMAP: PHASE 1 — INTRO FMV (Full Cinematic — Deferred)

> **DEFERRED — Requires pre-generated 90-second FMV cinematic clip. See ROADMAP section at end of document.**

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

## DEMO: PHASE 2 — STATIC ATMOSPHERE (Jason ambient echo)

**Duration:** Indefinite — loops until player speaks
**Player input:** Mic active. Webcam active. Game Master begins reading immediately.
**Visual:** Imagen 3 static background remains from Phase 1 (or GM triggers a new `scene_key` based on initial webcam read). CSS grain + vignette + subtle flicker loop.
**Audio (Gemini Live, ambient):** Jason talks quietly to himself. Not to the player. Not yet.

**Jason’s self-talk (generated, not scripted):** 
Jason is alone. He’s just landed. He’s looking around the chamber. He is narrating quietly to himself — observational, shaken but not broken. Audrey’s voice echoes distantly (Aoede voice, barely audible, different spatial position).

**Hint Overlay (same as original spec):**
```
Hint 1: "Talk to Jason with your voice"        // Lower-center
Hint 2: "Mic + webcam ON for full immersion"   // Lower-right
```
Same aesthetic: thin lo-fi monospace font, corrupted system message look.

**Game Master during loop:** Identical to original spec — reading player_emotion from webcam, calibrating baseline, no events triggered yet. 90-second timeout extends loop naturally.

---

## ⛔ ROADMAP: PHASE 2 — STATIC LOOP FMV (Looping Clip — Deferred)

> **DEFERRED — Requires pre-generated 8–12 second looping FMV clip + glasses HUD overlay. See ROADMAP section at end of document.**

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
    → GM selects scene_key → Imagen 3 generates background image (async, non-blocking)
    → Character audio plays; background image updates within ~2 seconds
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

## ⛔ DEFERRED TO ROADMAP: PHASE 5 — FMV PLAYBACK ARCHITECTURE

> **DEFERRED (March 2026)** — The entire pre-generated clip library approach is deferred.
> Demo uses Imagen 3 live generation for all scene visualization.
> Full spec preserved below and in the ROADMAP section at end of this document.
> Do not implement this for the contest build.

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
2. A deep amber bioluminescence seems to rise from below the water line — the only remaining visible source. *(Demo note: glitch CSS effect + flicker animation. Full spec: Jason’s cracked HUD is the only light source — inventory ghost icons pulse one final time. Requires glasses HUD frontend implementation — deferred.)*
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
*Last Updated: March 7, 2026 | Version 1.3 — Demo Scope Revision*
*Canon. Cross-reference WORLD_BIBLE.md v1.2 | Gamemaster.md v1.3 | Characters.md v1.3*

---

## ─── ROADMAP / DEPRECATED — Preserved for Future Development ───

> All content below is **deprecated from the contest demo scope** as of March 7, 2026.
> Preserved in full for Act 2+ development. Do not implement for the contest build.

<!-- DEPRECATED [FMV/GLASSES]: Phase 1 — 90-second Intro FMV cinematic
     Reason: Requires a pre-generated 90-second FMV clip (Veo 3.1 Fast pipeline),
     synchronized audio mix, and the cracked glasses overlay/HUD frontend.
     Demo replaces this with an immediate Imagen 3 cold open.
     Full spec preserved in the ⛔ ROADMAP: PHASE 1 section above.
     Restore: Build clip library + video player in myceliainteractive,
     implement glasses HUD overlay, wire to scene_key Firestore listener. -->

<!-- DEPRECATED [FMV]: Phase 2 — Static Loop FMV clip
     Reason: Requires pre-generated 8–12 second looping clip + glasses HUD overlay.
     Demo replaces with Imagen 3 static background + Gemini Live atmospheric ambient.
     Full spec preserved in the ⛔ ROADMAP: PHASE 2 section above. -->

<!-- DEPRECATED [FMV]: Phase 5 — FMV Playback Architecture (30–50 clip library)
     Reason: Building a 30–50 clip library in Veo 3.1 Fast is not feasible in 4 days.
     The scene_key format is IDENTICAL between FMV and Imagen 3.
     Only the frontend consumption layer changes.
     Full clip library spec preserved in the ⛔ DEFERRED: PHASE 5 section above.
     Restore: Generate clip library, build frontend video player,
     swap server-side scene_key handler from Imagen 3 call to manifest lookup. -->

<!-- DEPRECATED [BACKPACK]: Phase 4 — Gear Distribution (voice commands)
     Reason: Backpack system deferred entirely. Not referenced in Jason’s demo prompt.
     The “Gear Distribution (Voice Commands)” subsection in Phase 4 above is deferred.
     Full spec preserved in docs/Backpack.md.
     Restore: Implement backpack Firestore state, wire Jason’s full prompt,
     add gear transfer WebSocket events. -->
