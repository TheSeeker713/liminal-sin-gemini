/**
 * Keyword Library — per-step keyword sets, scene visual context injections,
 * and per-video frame extraction timestamps.
 *
 * Pure data module. No WS, no session state, no Gemini references.
 * Consumed by keywordListener.ts and gameMaster.ts.
 */

/**
 * Per-step keywords. When the keyword listener detects any of these from
 * player audio, the server immediately fires that step's gmCalls and advances.
 * The wall-clock timer runs in parallel — if no keyword is spoken, it expires
 * and auto-advances anyway.
 *
 * Steps without entries here have no keyword triggers (pure timer / chained_auto).
 */
export const STEP_KEYWORDS: Record<number, string[]> = {
  7:  ["flashlight", "light", "phone light", "flash", "lighter", "turn on", "can you see", "lamp", "torch"],
  9:  ["generator", "power", "machine", "engine", "humming", "noise", "that sound", "over there", "what is that"],
  11: ["start it", "turn it on", "activate", "power up", "switch", "run it", "start the generator", "turn on the generator", "crank"],
  13: ["card", "joker", "pick up", "grab it", "take it", "floor", "what is that", "pick that up", "reach down"],
  17: ["forward", "keep going", "move", "walk", "deeper", "go ahead", "keep moving", "push forward", "that way"],
  24: ["shaft", "maintenance", "go in", "enter", "down there", "ladder", "climb", "descend", "that opening"],
  27: ["elevator", "get in", "step in", "enter", "go inside", "ride it", "doors", "step inside"],
};

/**
 * Scene visual context injected into Jason when each scene fires.
 * Replaces the generic [VISUAL_CONTEXT] message. Tells Jason exactly what
 * he can see in his POV so he responds correctly to player questions.
 */
export const SCENE_VISUAL_CONTEXT: Record<string, string> = {
  flashlight_beam:
    "[SCENE_CONTEXT: Your flashlight just clicked on. The beam cuts through pitch darkness. " +
    "You are in a concrete maintenance tunnel — industrial, utilitarian, the Boring Company style. " +
    "Pipes run along the ceiling. The beam reaches about 20 feet before the darkness swallows it. " +
    "Damp walls, standing water in cracks on the floor. No exits visible behind you. " +
    "The tunnel stretches forward into black. You can now see your immediate surroundings.]",

  generator_area_start:
    "[SCENE_CONTEXT: Up ahead in the tunnel there is a large industrial generator — boxy, " +
    "metal housing, pipes and cables running from it into the wall. It is currently OFF and silent. " +
    "A low electrical hum suggests it could be activated. The generator sits against the tunnel wall " +
    "about 10 feet ahead of you. The tunnel continues past it into darkness.]",

  generator_area_operational:
    "[SCENE_CONTEXT: The generator is now ON and running. Overhead tunnel lights have flickered to life — " +
    "harsh fluorescent strips casting a yellow-white glow. You can see the tunnel clearly now. " +
    "Concrete walls, industrial piping, utility brackets. The generator vibrates and hums. " +
    "The newly-lit tunnel extends further ahead. Something is on the floor near the base of the generator.]",

  generator_card_reveal:
    "[SCENE_CONTEXT: With the lights on you can clearly see a playing card on the floor near the " +
    "generator's base. It is a Joker card — face up, slightly damp but legible. It should not be here. " +
    "Playing cards do not belong in underground maintenance tunnels. This is wrong.]",

  card1_pickup_pov:
    "[SCENE_CONTEXT: You are reaching down and picking up the Joker card from the floor. " +
    "It feels real — stiff cardboard, slightly damp. The card is now in your hand.]",

  tunnel_to_park_transition:
    "[SCENE_CONTEXT: The tunnel ahead opens up. The concrete walls give way to something " +
    "much larger. You can feel the space expanding — the echo changes, the air moves differently. " +
    "There is light ahead that is not from your flashlight or the tunnel fluorescents.]",

  park_transition_reveal:
    "[SCENE_CONTEXT: You are at the threshold between the boring tunnel and an impossible space. " +
    "Ahead of you is a fully intact waterpark — enormous, pristine, and impossibly underground. " +
    "Teal and turquoise water, functioning pool lights, wave machines humming. " +
    "This should not exist beneath a Las Vegas casino. It is perfect. It is operational. It is liminal.]",

  park_entrance:
    "[SCENE_CONTEXT: You have stepped into the waterpark. It stretches in every direction — " +
    "Olympic-scale pools, water slides curving overhead, walkways between water features. " +
    "Everything is lit, clean, and running. No people. No lifeguards. No signs of use. " +
    "The water ripples from the wave machines. The air is humid and warm. You are completely alone in a paradise.]",

  park_walkway:
    "[SCENE_CONTEXT: You are walking along a wide tiled walkway between water features. " +
    "Pools on both sides — still water reflecting the overhead lights. Slides in the distance. " +
    "Everything is perfectly maintained. No debris, no rust, no decay. " +
    "The walkway continues ahead toward what looks like a maintenance area at the far edge.]",

  park_liminal:
    "[SCENE_CONTEXT: You are in a transitional space — the waterpark tiles give way to " +
    "industrial concrete again. Ahead is a maintenance shaft entrance. The park recedes behind you. " +
    "This is the boundary between paradise and infrastructure.]",

  park_shaft_view:
    "[SCENE_CONTEXT: A maintenance shaft — steel and concrete, vertical access. " +
    "It descends deeper underground. There is an elevator platform or cage visible. " +
    "This goes further down. The waterpark is behind you now.]",

  maintenance_entry:
    "[SCENE_CONTEXT: You are at the elevator entry point. Heavy steel doors frame a freight elevator — " +
    "industrial, functional, old but working. The shaft extends downward into darkness. " +
    "The elevator looks operational. You could ride it down.]",

  elevator_inside:
    "[SCENE_CONTEXT: You are inside the freight elevator. Steel walls close around you. " +
    "A single overhead light flickers. The doors closed behind you and the elevator is descending. " +
    "Cables groan above. You are going deeper underground.]",

  elevator_inside_2:
    "[SCENE_CONTEXT: The elevator continues descending. The walls vibrate. " +
    "Through gaps you can see concrete shaft walls sliding upward. " +
    "You are approaching the maintenance level below.]",

  maintenance_panel:
    "[SCENE_CONTEXT: The elevator has opened onto a maintenance corridor — narrow, dimly lit. " +
    "Exposed piping, electrical conduit, a control panel on the wall. " +
    "The hallway stretches ahead. Something moved at the far end — or you imagined it. " +
    "There may be something on the floor further down the corridor.]",

  hallway_pov_02:
    "[SCENE_CONTEXT: You are further down the maintenance hallway. The corridor narrows. " +
    "Dim emergency lighting. Pipes and cables overhead. The air feels different here — colder, " +
    "more charged. You need to find the second card. Look carefully at the walls, floor, any surface. " +
    "Time is running out.]",

  card2_pickup_pov:
    "[SCENE_CONTEXT: You see the second card — the Queen of Spades — exposed on a surface. " +
    "You are reaching for it. This is the last card you need.]",
};

/**
 * Per-video frame extraction timestamps (in seconds) for feedVideoFramesToJason().
 * Keyed by mediaId (not sceneKey — sceneKey resolves to mediaId first).
 * Falls back to [1.0, 3.0, 5.0] if not listed.
 */
export const SCENE_FRAME_TIMESTAMPS: Record<string, number[]> = {
  tunnel_flashlight_01:  [0.5, 2.0, 4.0],
  tunnel_generator_01:   [1.0, 3.0, 5.5],
  card_joker_01:         [0.5, 2.0, 4.0],
  card_pickup_01:        [1.0, 3.0, 5.0],
  tunnel_transition_01:  [1.0, 3.5, 6.0],
  park_reveal_01:        [1.0, 3.0, 5.5],
  park_walkway_01:       [1.0, 3.5, 6.0],
  park_walkway_02:       [1.0, 3.0, 5.5],
  park_liminal_01:       [0.5, 2.5, 5.0],
  shaft_maintenance_01:  [1.0, 3.0, 5.0],
  maintenance_reveal_01: [1.0, 3.0, 5.0],
  elevator_entry_01:     [0.5, 2.5, 4.5],
  elevator_inside_01:    [1.0, 3.0, 5.0],
  elevator_inside_02:    [1.0, 3.0, 5.0],
  hallway_pov_01:        [1.0, 3.5, 6.0],
  hallway_pov_02:        [0.5, 2.0, 4.0],
  acecard_reveal_01:     [1.0, 3.0, 5.0],
  card_pickup_02:        [0.5, 2.0, 4.0],
};

/**
 * Returns the keyword list formatted for the keyword listener's prompt update.
 */
export function getKeywordListForStep(step: number): string[] {
  return STEP_KEYWORDS[step] ?? [];
}
