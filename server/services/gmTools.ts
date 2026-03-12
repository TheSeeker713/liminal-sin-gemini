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
              description: 'The scene key that maps to a pre-generated FMV clip. Canonical format: {character}_{emotion}_{context}_{action} — e.g. "jason_afraid_tunnel_looking", "jason_calm_tunnel_investigates", "audrey_distant_echo_warning", "josh_bravado_echo_joke", "slotsky_cards_tunnel_wall". Never invent freeform keys outside this format.'
            }
          },
          required: ['sceneKey']
        }
      },
      {
        name: 'triggerVideoGen',
        description: 'Animate the current static scene image into a short video clip using Veo 3.1 Fast. Call this AFTER triggerSceneChange when you want the scene to feel alive. The still image is already being shown to the player — this adds movement. Non-blocking: the still image stays visible while the video generates.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            sceneKey: {
              type: Type.STRING,
              description: 'The same sceneKey used in the preceding triggerSceneChange call. Must match exactly so the animation prompt aligns with the still image.'
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
              description: 'The card identifier: "card1" for the Jack of Clubs (Phase 5B), or "card2" for the Queen of Spades (Phase 7).'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'triggerDreadTimerStart',
        description: 'Start the invisible dread countdown timer at the beginning of Phase 7 (maintenance area). If timer expires before card2 is collected, the session ends in Game Over. Duration: 90000ms (90 seconds).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            durationMs: {
              type: Type.NUMBER,
              description: 'Duration of the dread timer in milliseconds. Typical value: 90000 (90 seconds).'
            }
          },
          required: ['durationMs']
        }
      }
    ]
  }
];
