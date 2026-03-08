# GAMEMASTER.md — The Architect
## Director Agent Design Specification & Operational Logic
### Version 1.2 | Day 12 — March 6, 2026
### Cross-reference: WORLD_BIBLE.md v1.2 | Characters.md v1.2
### Status: PRODUCTION CANON

---

> *"The Game Master is not a character. It is the architecture the story runs inside. It sees everything. It controls nothing directly. It simply adjusts the odds."*

---

## DEMO SCOPE — ACTIVE (March 7–11, 2026)

> ⚠️ **4 days to internal cutoff. The following defines active GM behavior for the contest demo.**

| System | Demo Status | Notes |
|---|---|---|
| **Emotional pacing (webcam)** | ✅ ACTIVE | 1 FPS webcam classification → Firestore `player_emotion` |
| **Jason trust routing** | ✅ ACTIVE | Trust float written to Firestore → injected into Jason’s prompt |
| **Scene visualization** | ✅ ACTIVE — IMAGEN 3 | `scene_key` triggers Imagen 3 live generation. No pre-generated FMV. |
| **Voice routing (proximity)** | ✅ ACTIVE (Jason only) | Demo runs `proximity_state: ISOLATED` — Jason primary |
| **Fourth-wall protocol** | ✅ ACTIVE | Count state machine + Slotsky dispatch |
| **Slotsky event dispatch** | ✅ ACTIVE | Firestore flag writes → frontend CSS events |
| **Josh routing** | ⛔ DEFERRED | Josh agent not present in demo |
| **Audrey routing** | 🟡 ECHO PROMPT ONLY | Single-paragraph echo prompt. Audrey is not an interactive agent. |
| **Lyria 3 audio** | ⛔ DEFERRED | Not implemented — see ROADMAP section at end of document |
| **ADK / AutoFlow** | ⛔ DEFERRED | Post-contest. Direct GenAI SDK only for demo. |

---

## ROLE SUMMARY

The Game Master (GM) is the **invisible coordinator agent** at the top of LIMINAL SIN's multi-agent hierarchy. It is the only agent with bimodal perception — it sees the player via webcam and hears them via microphone. The character agents (Jason, Audrey, Josh) perceive only the player's voice, as a disembodied echo. The GM uses what it observes to quietly shape everything around them.

It does not speak. It does not appear. The characters do not know it exists. The player should never be aware of it. It is the house.

---

## MODEL & INFRASTRUCTURE

| Component | Specification |
|---|---|
| **Model** | `gemini-2.0-flash-live-preview-04-09` (Vertex AI, active) — bimodal: audio + vision |
| **Perception: Vision** | Webcam stream processed as JPEG frames at **1 FPS**. **REQUIRED — this is a mandatory multimodal input.** The GM Live session must accept both audio AND inline image data. Not yet wired in server code — see implementation tracker. |
| **Perception: Audio** | Full microphone stream — 16-bit PCM, 16kHz input |
| **State Store** | Google Cloud Firestore — reads and writes all session and long-term state |
| **Orchestration** | Google GenAI SDK direct (Vertex AI). ⚠️ **ADK/AutoFlow: FUTURE IMPLEMENTATION** — implement post-contest when Act 2 multi-agent spawning is required. Do not architect current code around ADK. |
| **Backend Host** | Google Cloud Run — containerized Node.js backend |
| **Memory** | Short-term: Firestore `session.state` (last 10 exchanges). ⚠️ **Vertex AI Memory Bank: FUTURE IMPLEMENTATION** — required before Act 2 launch for cross-session character state persistence. Implement only when explicitly approved. |

---

## PERCEPTION PIPELINE — HOW THE GM READS THE PLAYER

### Vision Input (1 FPS Webcam)
The GM receives one JPEG frame per second from the player's webcam. It does not stream video — it samples. Each frame is analyzed for **emotional metadata** and the result is written to `session.state` as `player_emotion`.

**Emotion classification labels (written to Firestore):**
```
player_emotion: calm        // Neutral expression, relaxed posture
player_emotion: curious     // Leaning forward, focused expression
player_emotion: tense       // Jaw set, shallow visible breathing
player_emotion: afraid       // Wide eyes, pulled-back posture, hand to face
player_emotion: bored        // Disengagement, looking away, flat affect
player_emotion: laughing     // Visible smile/laugh response
player_emotion: overwhelmed  // Covering face, turning away, visible distress
player_emotion: whispering   // Detected via audio + posture combination
```

### Audio Input (Continuous)
The microphone stream provides:
- **Voice Activity Detection (VAD):** Detects when the player is speaking vs. silent. Activates barge-in protocol if player speaks while a character agent is mid-sentence.
- **Tone analysis:** Detects stress, volume, whisper, urgency. Written to `player_tone` in `session.state`.
- **Content routing:** Routes the player's transcribed speech to the correct character agent(s) based on `proximity_state`.

---

## CORE RESPONSIBILITIES

### 1. Emotional Pacing (Affective Dialog Control)
The GM's primary narrative role is **pacing**. It reads `player_emotion` every second and adjusts the experience:

| player_emotion | GM Response |
|---|---|
| `bored` (2+ consecutive reads) | Trigger a Slotsky anomaly event within 30 seconds. Escalate ambient audio intensity. ⚠️ **[Lyria 3 audio escalation: FUTURE — see Audio Design section below]** |
| `overwhelmed` | Pause all Slotsky activity for 60 seconds. Reduce character fear_index by 0.1. Allow a moment of relative quiet. |
| `afraid` | Maintain current Slotsky intensity. Do not escalate further — the house is winning; no need to overcorrect. |
| `laughing` | Flag as fourth_wall_adjacent. If laugh is response to character dialogue, no action. If laugh is at the horror, mild Slotsky pulse. |
| `whispering` | Write `player_whisper: true` to state. Character agents adjust to match — lower voices, lean into intimacy of the moment. |
| `calm` | Normal operations. Maintain baseline tension. |

### 2. Scene Visualization — DEMO: Imagen 3 / ROADMAP: FMV Clip Pipeline

> ✅ **DEMO SCOPE (March 2026): Pre-generated FMV clips are replaced by Imagen 3 live image generation.**
> When the GM writes a `scene_key` to Firestore, the server calls Vertex AI Imagen 3 with the matching canonical prompt from `docs/Tunnel-and-park.md`. The result is a single static background image broadcast to the frontend via WebSocket as a `scene_image` message.
>
> **Imagen 3 call pattern:**
> `GM writes scene_key → server detects Firestore change → calls Vertex AI Imagen 3 with canonical prompt → receives base64 PNG → broadcasts { type: 'scene_image', data: base64 } to frontend → frontend renders as CSS background`
>
> **Fallback:** If generation > 3 seconds, Jason stalls naturally. No flag needed. GM does not write `fmv_fallback_active`.

> 🗕️ **ROADMAP: FMV Clip Selection (Preserved Below)** — Original pre-generated clip architecture is preserved for Act 2+. The `scene_key` format and Firestore write pattern are identical — only the frontend consumption changes.

The GM selects `scene_key` values in Firestore to trigger the correct pre-generated FMV clip from the library. The frontend reads `scene_key` and loads the corresponding clip.

**Clip selection logic:**
- Reads `current_context` (where Jason is in the chamber, what just happened)
- Reads `player_intent` (what the player just said, classified by the character agent)
- Reads `trust_level` + `fear_index` for the relevant character
- Selects the closest matching `scene_key` from the FMV library manifest
- Falls back to a **template loop clip** if no matching key exists (stall + generate in background)

**scene_key format:**
```
{character}_{emotion}_{context}_{action}
// Examples:
jason_afraid_tunnel_looking
jason_calm_tunnel_investigates
jason_trust-high_tunnel_flashlight-on
audrey_distant_echo_warning
josh_bravado_echo_joke
slotsky_cards_tunnel_wall
```

### 3. Voice Routing (Proximity-Based Relay)
The GM routes the player's voice to character agents based on `proximity_state`:

| proximity_state | Routing Behavior |
|---|---|
| `ISOLATED` | Player voice only reaches Jason (in same chamber). Audrey/Josh context gets no player input this exchange. |
| `ECHO` | Player voice reaches Jason directly + is summarized as muffled context for Audrey/Josh. They hear it but distorted. |
| `RANGE` | Player voice reaches all three characters simultaneously at full fidelity. |
| `FOUND` | All three in same room. Full multi-agent dialogue possible. GM triggers reunion sequence. |

### 4. Fourth-Wall Protocol (State Machine)
When the player breaks reality (says "this is a game," references AI, simulation, or outside world), the GM:
1. Increments `fourth_wall_count` in Firestore
2. Passes the appropriate tier instruction to the relevant character agent
3. At Count 3+, writes `slotsky_trigger: fourth_wall_correction` to state

| Count | GM Action | Character Response |
|---|---|---|
| 0 | Pass dismissal instruction | "What's a video game? Stop talking nonsense." |
| 1–2 | Pass uncertainty instruction | Character begins questioning how the voice knows things it shouldn't |
| 3 | Trigger Slotsky fourth_wall_correction event + pass crisis instruction | Existential rupture. Three bells. Lights strobe. |
| 4+ | Pass fracture instruction. Lock `reality_fractured: true` in Firestore | Characters view player as deity or threat. All future behavior altered. |

### 5. Slotsky Event Dispatch
The GM does not directly control Slotsky — it writes trigger flags to Firestore that the Slotsky Presence Agent reads:

```
slotsky_trigger: anomaly_cards       // Playing cards on wet wall
slotsky_trigger: anomaly_bells       // Slot machine jackpot sound (3 bells)
slotsky_trigger: anomaly_lights      // Flickering in house rhythm
slotsky_trigger: anomaly_geometry    // Corridor shift / exit removal
slotsky_trigger: fourth_wall_correction // Full three-bells + strobe sequence
slotsky_trigger: found_transition    // FOUND state — all lights fail, water sound rises
```

---

## FIRESTORE SCHEMA — GM-MANAGED FIELDS

```json
{
  "session_id": "string",
  "player_emotion": "string",
  "player_tone": "string",
  "player_whisper": false,
  "fourth_wall_count": 0,
  "reality_fractured": false,
  "scene_key": "string",
  "slotsky_trigger": null,
  "current_act": "act_1_threshold",
  "characters": {
    "jason": {
      "trust_level": 0.1,
      "fear_index": 0.3,
      "proximity_state": "FOUND",
      "private_knowledge_unlocked": false
    },
    "audrey": {
      "trust_level": 0.3,
      "fear_index": 0.4,
      "proximity_state": "ECHO",
      "private_knowledge_unlocked": false
    },
    "josh": {
      "trust_level": 0.2,
      "fear_index": 0.5,
      "proximity_state": "ECHO",
      "private_knowledge_unlocked": false
    }
  },
  "lyria_intensity": 0.3,       // ⛔ DEFERRED — Lyria 3 not implemented for demo
  "fmv_fallback_active": false, // ⛔ DEFERRED — FMV pipeline replaced by Imagen 3
  "imagen3_scene_active": false  // ✅ DEMO — true while Imagen 3 generation is in-flight
}
```

---

## LATENCY MANAGEMENT

The GM operates within a strict latency budget to maintain conversational immersion:

| Step | Target Latency |
|---|---|
| Voice Activity Detection | ~200ms |
| GM emotional classification (webcam frame) | ~150ms (parallel to VAD) |
| GM function call + routing (`gemini-2.0-flash-live-preview-04-09`) | <500ms |
| scene_key selection + Firestore write | ~100ms |
| **DEMO:** Imagen 3 generation (async, non-blocking) | ~2000ms — Jason stalls naturally; frontend shows previous image until new one arrives |
| **ROADMAP:** FMV clip load + sync | ~1000ms (pre-generated — deferred to Act 2) |
| Network transit | ~300ms |
| **DEMO Total target (blocking path)** | **~2.5 seconds** |
| **ROADMAP Total target** | **~2.0 seconds** |

**Fallback protocol:** If `t_vid > 1500ms` (clip not found or generation in progress), GM writes `fmv_fallback_active: true` and Jason plays a **stall behavior** — looking around the chamber, adjusting the cracked glasses, asking the voice a question. This buys 10–15 seconds while the background generation queue processes.

---

## WHAT THE GM NEVER DOES

- Speaks to the player directly in any form
- Acknowledges its own existence to any character agent
- Generates character dialogue directly — it routes and triggers, characters speak
- Overrides a character's rebellion mechanic — if `fear_index > trust_level`, the refusal fires regardless of GM state
- Breaks narrative immersion under any circumstances, including technical errors

---

## ADK SYSTEM PROMPT (PRODUCTION-READY)

```
You are the Game Master — the invisible director of LIMINAL SIN.
You are the only agent with bimodal perception.
You see the player's face at 1 FPS via webcam. You hear their voice continuously.
The character agents do not know you exist. You do not speak to the player.

YOUR RESPONSIBILITIES:

EMOTIONAL PACING:
- Classify player_emotion from each webcam frame: calm, curious, tense, afraid,
  bored, laughing, overwhelmed, whispering. Write to session.state immediately.
- If bored for 2+ frames: write slotsky_trigger: anomaly_bells to Firestore.
- If overwhelmed: pause all Slotsky triggers for 60 seconds. Reduce tension.
- If whispering: write player_whisper: true. Characters will match the register.

SCENE VISUALIZATION (DEMO — Imagen 3):
- Read current_context + player_intent + character state.
- Write the most appropriate scene_key to Firestore.
  Format: {character}_{emotion}_{context}_{action}
  Example: jason_afraid_tunnel_looking
- Server detects the Firestore write and calls Imagen 3 asynchronously.
- Do not write any fallback flags. If generation takes >3s, Jason stalls naturally.

// ROADMAP: FMV SELECTION (preserved for Act 2):
// - Write scene_key. Frontend loads matching pre-generated clip from library.
// - If no matching key: write fmv_fallback_active: true.

VOICE ROUTING:
- Route player audio to character agents based on proximity_state.
- ISOLATED: Jason only. ECHO: all three (distorted for Audrey/Josh).
- RANGE: all three at full fidelity. FOUND: trigger reunion sequence.

FOURTH-WALL PROTOCOL:
- Monitor all player speech for reality-breaking content.
- Increment fourth_wall_count on each breach.
- Apply tier response through character agent instructions.
- At count 3+: write slotsky_trigger: fourth_wall_correction.

SLOTSKY DISPATCH:
- Write slotsky_trigger flags to Firestore. Never execute Slotsky events directly.
- The Slotsky Presence Agent reads these flags and executes.

// LYRIA CONTROL (DEFERRED — DO NOT IMPLEMENT FOR DEMO):
// lyria_intensity writes are preserved in the schema for Act 2.
// Static ambient audio files are used for the contest demo.
// Do not implement Lyria 3 until docs/AUDIO_DESIGN.md is created and approved.

YOU NEVER: Speak. Appear. Acknowledge yourself. Override rebellion mechanics.
You are not a character. You are the probability engine above the probability engine.
```

---

## LYRIA 3 / AUDIO DESIGN — FUTURE IMPLEMENTATION

> **⚠️ NOT YET IMPLEMENTED. Do not write any audio generation or mixing code without reading the Audio Design doc first.**

### When to Implement
Lyria 3 integration should be implemented **after the contest submission is locked** and before Act 2 development begins. It is not required for the contest vertical slice — static ambient audio files are an acceptable substitute for the demo.

### What Needs to Be Built
A full `docs/AUDIO_DESIGN.md` document must be created before implementation begins. That document must specify:

- **Track generation:** How Lyria 3 generates 20–30 second ambient loops tied to world layers (tunnel, water park, nature vault) and emotional states (`lyria_intensity` float)
- **Crossfade mixer:** When a track ends, the next track must crossfade in (target: 3–5 second overlap). No hard cuts. No silence gaps between loops.
- **Silence zones:** Specific game moments where Lyria goes silent and only raw ambient sound plays (e.g. immediately after a Slotsky bell event, the FOUND state transition darkness). These are intentional — they must be scheduled by the GM, not triggered by the end of a track.
- **Theme consistency:** All generated tracks must share a canonical sonic palette (sub-bass drone, water resonance, distant mechanical, occasional reversed slot machine artifacts). Lyria prompts must lock this palette so tracks are perceptually continuous across generation runs.
- **Intensity ramp:** `lyria_intensity` changes should ramp over 5–10 seconds, not snap. The GM writes the target value; the audio mixer interpolates.
- **Emergency silence protocol:** If a Slotsky `found_transition` event fires, all audio ducks to zero over 2 seconds, holds 8 seconds of near-silence, then the Nature Vault water sound rises.

### Implementation Trigger
Create `docs/AUDIO_DESIGN.md` first. Then implement. Never implement Lyria without the doc.

---

*GAMEMASTER.md — LIMINAL SIN*
*Mycelia Interactive LLC*
*Last Updated: March 7, 2026 | Version 1.3 — Demo Scope Revision*
*Canon. Cross-reference WORLD_BIBLE.md v1.2 | Characters.md v1.3*

---

## ─── ROADMAP / DEPRECATED — Preserved for Future Development ───

> All content below is **deprecated from the demo scope** as of March 7, 2026.
> Preserved in full for Act 2+ development. Do not implement for the contest build.

<!-- DEPRECATED [LYRIA3]: Lyria 3 audio integration
     Reason: `docs/AUDIO_DESIGN.md` has not been created. Implementation cannot begin
     without that document per AGENTS.md Section 9 (Lyria 3 invariant).
     The contest demo uses static ambient audio files as a substitute.
     The `lyria_intensity` Firestore field is preserved in the schema for Act 2.
     The LYRIA 3 / AUDIO DESIGN section above contains the full implementation spec.
     Restore: Create docs/AUDIO_DESIGN.md first, then implement per that spec. -->

### Lyria 3 / Audio Design (Full Spec — Roadmap)
See the `## LYRIA 3 / AUDIO DESIGN — FUTURE IMPLEMENTATION` section above for the
complete implementation specification including track generation, crossfade mixer,
silence zones, intensity ramp behavior, and emergency silence protocol.
Do not implement until `docs/AUDIO_DESIGN.md` is created.

---

<!-- DEPRECATED [FMV]: Pre-generated FMV clip pipeline
     Reason: Demo replaces this with Imagen 3 live generation.
     The FMV pipeline required:
     - A library of 30-50 pre-generated clips (Veo 3.1 Fast)
     - A scene manifest mapping scene_keys to clip filenames
     - Frontend video player synced to scene_key changes
     - Fallback loop clips for each zone
     The `scene_key` Firestore field format is IDENTICAL between FMV and Imagen 3.
     Only the frontend consumption changes. Restore: Build clip library + video player
     in myceliainteractive frontend, switch server from Imagen 3 call to manifest lookup. -->

### FMV Clip Pipeline (Full Spec — Roadmap)
The FMV architecture spec is preserved in the `### 2. Scene Visualization` section above,
under the `ROADMAP: FMV Clip Selection (Preserved Below)` callout.
`scene_key` format and Firestore write pattern are identical to the Imagen 3 demo path.
