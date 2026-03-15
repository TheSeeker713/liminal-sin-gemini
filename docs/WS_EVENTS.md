# WS_EVENTS.md — Liminal Sin WebSocket Event Registry

## Version 3.0 | March 15, 2026

> Extracted from SHOT_SCRIPT.md. Extends the contract defined in `CURRENT_STATE.md`.

---

## WS EVENT REGISTRY

| Event                  | Direction | Payload                                                                                                                                               | Status      |
| ---------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `intro_complete`       | FE→BE     | `{}`                                                                                                                                                  | ✅ Existing |
| `player_speech`        | FE→BE     | `{ audio: base64 }`                                                                                                                                   | ✅ Existing |
| `player_frame`         | FE→BE     | `{ jpeg: base64 }`                                                                                                                                    | ✅ Existing |
| `hallway_pov_02_ready` | FE→BE     | `{}`                                                                                                                                                  | ✅ Existing |
| `session_ready`        | BE→FE     | `{ session_id: string }`                                                                                                                              | ✅ Existing |
| `agent_speech`         | BE→FE     | `{ agent: 'jason'\|'audrey', audio: base64 }`                                                                                                         | ✅ Existing |
| `agent_interrupt`      | BE→FE     | `{ agent: 'jason' }`                                                                                                                                  | ✅ Existing |
| `trust_update`         | BE→FE     | `{ trust_level: number, fear_index: number }`                                                                                                         | ✅ Existing |
| `hud_glitch`           | BE→FE     | `{ intensity: string, duration_ms: number }`                                                                                                          | ✅ Existing |
| `scene_change`         | BE→FE     | `{ payload: { sceneKey: string, mediaId: string, triggerType: string, timeoutSeconds: number } }`                                                     | ✅ Existing |
| `scene_image`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, data: base64 } }`                                                                       | ✅ Existing |
| `scene_video`          | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, audioMode, url: string } }`                                                             | ✅ Existing |
| `video_gen_started`    | BE→FE     | `{ payload: { sceneKey, mediaId, triggerType, timeoutSeconds, audioMode } }`                                                                          | ✅ Existing |
| `slotsky_trigger`      | BE→FE     | `{ payload: { anomalyType: string } }`                                                                                                                | ✅ Existing |
| `hint`                 | BE→FE     | `{ text: string }`                                                                                                                                    | ✅ Existing |
| `player_speak_prompt`  | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `overlay_text`         | BE→FE     | `{ payload: { text: string, variant: string, durationMs: number } }`                                                                                  | ✅ Existing |
| `npc_idle_nudge`       | BE→FE     | `{ payload: { phase: string, secondsSilent: number, urgency: 'soft'\|'urgent' } }`                                                                    | ✅ Existing |
| `autoplay_advance`     | BE→FE     | `{ payload: { fromStep: number, toStep: number, mediaId?: string, triggerType?: string, timeoutSeconds?: number, reason: 'timeout'\|'npc_choice' } }` | ✅ Existing |
| `audience_update`      | BE→FE     | `{ payload: { personCount, groupDynamic, observedEmotions } }`                                                                                        | ✅ Existing |
| `card_discovered`      | BE→FE     | `{ cardId: 'card1'\|'card2' }`                                                                                                                        | ✅ Existing |
| `card_collected`       | FE→BE     | `{ cardId: 'card1'\|'card2' }`                                                                                                                        | ✅ Existing |
| `dread_timer_start`    | BE→FE     | `{ durationMs: number }`                                                                                                                              | ✅ Existing |
| `game_over`            | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `good_ending`          | BE→FE     | `{}`                                                                                                                                                  | ✅ Existing |
| `wildcard3_trigger`    | BE→FE     | `{ payload: { sceneKey: 'wildcard_good_ending' } }`                                                                                                   | ✅ Existing |
| `acecard_keyword_timer_start` | BE→FE | `{ payload: { durationMs: 30000 } }`                                                                                                           | ✅ Section A |
| `acecard_reveal_start` | BE→FE     | `{ payload: { mediaId: 'acecard_reveal_01' } }`                                                                                                       | ✅ Section A |
| `card_pickup_02_ready` | BE→FE     | `{ payload: { mediaId: 'card_pickup_02', durationMs: 15000 } }`                                                                                       | ✅ Section A |
| `acecard_reveal_complete` | FE→BE  | `{}`                                                                                                                                                  | ✅ Section A |

---

## `slotsky_trigger` anomalyType Values

All 13 valid `anomalyType` values for the `slotsky_trigger` event:

**GM-controlled** (declared in `gmTools.ts`, fired by Gemini function calls):

| # | anomalyType               | Description                                                            |
|---|---------------------------|------------------------------------------------------------------------|
| 1 | `anomaly_cards`           | Subtle escalation — card-related visual anomaly                        |
| 2 | `anomaly_bells`           | Subtle escalation — audio bell anomaly                                 |
| 3 | `anomaly_lights`          | Subtle escalation — lighting flicker anomaly                           |
| 4 | `anomaly_geometry`        | Removes an exit — geometric impossibility                              |
| 5 | `fourth_wall_correction`  | Full three-bells + strobe sequence at fourth_wall_count >= 3           |
| 6 | `found_transition`        | Cosmetic Slotsky pulse when characters reach FOUND state               |

**Backend-controlled** (fired by `server.ts` sequencer, never by GM):

| #  | anomalyType                     | Description                                                      |
|----|---------------------------------|------------------------------------------------------------------|
| 7  | `wildcard_vision_feed_start`    | Signals wildcard vision feed playback is beginning               |
| 8  | `wildcard_vision_feed_end`      | Signals wildcard vision feed playback has ended                  |
| 9  | `wildcard_scare_sfx`            | Triggers scare SFX during wildcard vision video                  |
| 10 | `wildcard_game_over_loading`    | Frontend CSS glitch/loading animation for game_over prep         |
| 11 | `wildcard_game_over_start`      | Signals wildcard game_over media playback is beginning           |
| 12 | `wildcard_good_ending_loading`  | Frontend CSS glitch/loading animation for good_ending prep       |
| 13 | `wildcard_good_ending_start`    | Signals wildcard good_ending media playback is beginning         |

> **SFX CONVENTION — Universal Scene Transition:** `glitch_low` (random variant) fires on every `scene_change`, `scene_image`, and `scene_video` event, and on every VHS-swap (video-to-still) transition. It is the **only** SFX used for visual scene transitions. No other SFX replaces this role.

---

_WS_EVENTS.md — LIMINAL SIN_
_Mycelia Interactive LLC_
_Version 3.0 | March 15, 2026_
_Canon. Cross-reference: SHOT_SCRIPT.md | CURRENT_STATE.md | AGENTS.md_
