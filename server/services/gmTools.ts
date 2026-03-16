import { Tool, Type } from '@google/genai';

/**
 * Function tool declarations for the Game Master Overseer.
 * When Gemini calls one of these, the server intercepts, persists
 * the state change to Firestore, and broadcasts the event over WebSocket
 * to the frontend so the UI can react (glitches, FMV swaps, etc).
 */
export const gameMasterTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'triggerTrustChange',
        description: 'Update the Trust Level for the current player session based on their behavior. Call this whenever the player is demonstrably honest (raises trust) or dishonest/manipulative (lowers trust).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            newTrustLevel: {
              type: Type.STRING,
              enum: ['Neutral', 'High', 'Low'],
              description: 'The new trust level to assign to the player.'
            },
            reason: {
              type: Type.STRING,
              description: 'A brief internal reason for why trust changed. Not shown to player.'
            }
          },
          required: ['newTrustLevel', 'reason']
        }
      },
      {
        name: 'triggerFearChange',
        description: 'Update the Fear Index for the current player session. Call this when the player has a genuine frightened reaction, witnesses something horrifying, or calms down after a scare.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            newFearLevel: {
              type: Type.NUMBER,
              description: 'New fear index as a float 0.0–1.0. 0.0 = fully calm, 1.0 = paralysed with fear.'
            },
            reason: {
              type: Type.STRING,
              description: 'A brief internal reason for the fear change. Not shown to player.'
            }
          },
          required: ['newFearLevel', 'reason']
        }
      },
      {
        name: 'triggerGlitchEvent',
        description: 'Trigger a visual or audio glitch on the frontend. Use this when the player is aggressive, breaks immersion, or when escalating dread is needed.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            intensity: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high'],
              description: 'Severity of the glitch effect.'
            },
            type: {
              type: Type.STRING,
              enum: ['visual', 'audio', 'both'],
              description: 'Which kind of glitch to fire.'
            }
          },
          required: ['intensity', 'type']
        }
      },
      {
        name: 'triggerSceneChange',
        description: 'Switch the active FMV scene key. The frontend reads this from Firestore and loads the corresponding video clip.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            sceneKey: {
              type: Type.STRING,
              description: 'Canonical Act 1 zone key from the Scene Key Registry. Use only these exact keys: flashlight_beam, generator_area_start, generator_area_operational, generator_card_reveal, card1_pickup_pov, tunnel_to_park_transition, park_transition_reveal, park_entrance, park_walkway, park_liminal, park_shaft_view, elevator_inside, maintenance_entry, elevator_inside_2, maintenance_panel, hallway_pov_02, card2_pickup_pov, acecard_reveal. Do not invent freeform keys. Do not use underscore-separated character/emotion/action formats.'
            }
          },
          required: ['sceneKey']
        }
      },
      {
        name: 'triggerSlotsky',
        description: 'Trigger a Slotsky anomaly event. Use when boredom is detected for 2+ consecutive reads, or when fourth_wall_count >= 3. anomaly_cards / anomaly_bells / anomaly_lights are subtle escalations; anomaly_geometry removes an exit; fourth_wall_correction fires the full three-bells + strobe sequence at count >= 3; found_transition fires when all characters reach FOUND state.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            anomalyType: {
              type: Type.STRING,
              enum: ['anomaly_cards', 'anomaly_bells', 'anomaly_lights', 'anomaly_geometry', 'fourth_wall_correction', 'found_transition'],
              description: 'The canonical Slotsky trigger flag written to the slotsky_trigger field in Firestore. Must match exactly.'
            }
          },
          required: ['anomalyType']
        }
      },
      {
        name: 'triggerAudienceUpdate',
        description: 'Report how many people you can see in the webcam feed and their emotional state. Call this within the first 10 seconds of the session, and again whenever the person count changes. This silently informs Jason so he can react naturally in-character - he cannot see anyone but he can notice a second voice or extra sounds through the smartglasses audio channel.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            personCount: {
              type: Type.NUMBER,
              description: 'Number of people visible in the webcam. 1 = solo, 2 = pair, 3+ = group.'
            },
            groupDynamic: {
              type: Type.STRING,
              enum: ['solo', 'pair', 'group', 'unknown'],
              description: 'Characterize the group: solo = one player alone; pair = two people; group = three or more; unknown = cannot determine from webcam.'
            },
            observedEmotions: {
              type: Type.STRING,
              description: 'Brief description of the visible emotional states. E.g. "one person laughing nervously", "two people — one afraid, one calm", "group of four, mixed reactions".'
            }
          },
          required: ['personCount', 'groupDynamic', 'observedEmotions']
        }
      },
      {
        name: 'triggerAudreyVoice',
        description: 'Fire after anomaly_cards + card scene shown. Audrey speaks once. High trust (>=0.7) = hopeful echo, calls Jason by name. Low trust (<0.4) = panicked whisper, does not use his name. Only call this in Beat 6.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            trustLevel: {
              type: Type.NUMBER,
              description: 'The current trust level float (0.0–1.0). Determines whether Audrey sounds hopeful (>=0.7) or frightened and distant (<0.4).'
            }
          },
          required: ['trustLevel']
        }
      },
      {
        name: 'triggerCardDiscovered',
        description: 'Emit a collectible card overlay to the player\'s screen at the right story beat. Call when Jason finds the playing card at the specified location. The frontend pauses scene progression until the player clicks the card.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            cardId: {
              type: Type.STRING,
              enum: ['card1', 'card2'],
              description: 'The card identifier: "card1" for the Joker card (Phase 5B), or "card2" for the Ace card (Phase 7).'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'triggerDreadTimerStart',
        description: 'Start the acecard keyword window timer at the hallway_pov_02 step. Player must say the correct keyword phrase before this timer expires or the session ends in Game Over. Duration: 30000ms (30 seconds). Only call this at step 31 — do not call during earlier maintenance steps.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            durationMs: {
              type: Type.NUMBER,
              description: 'Duration of the keyword window in milliseconds. Typical value: 30000 (30 seconds).'
            }
          },
          required: ['durationMs']
        }
      },
      {
        name: 'triggerAcecardReveal',
        description: 'Call this at step 31 (hallway_pov_02) when the player gives any instruction meaning: find, open, grab, pick up, take, retrieve, look at a panel, check the wall, or identify a hidden object — e.g. "the panel", "open it", "hidden panel", "grab it", "take the card", "get it", "pick it up", "there — take that", "what\'s that on the wall", "found it", "over there", "right there". Any semantically broad instruction to find, reveal, or acquire something counts. This unlocks the acecard_reveal_01 clip and begins the final 15-second card pickup countdown. Do not call outside the 30-second keyword window. Do not call if no such instruction has been given.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      }
    ]
  }
];
