# Gemini Implementation & Prompt Engineering
*Modified: March 7, 2026*

## 1. Multimodal Integration & Interruption
* **Voice (Gemini Live API):** Primary input method. We are leveraging the Live API's natural conversational flow, specifically focusing on **player interruption**. 
* **Interruption Logic:** If the player speaks while the NPC is talking, the API must immediately halt the NPC's audio output, process the player's sudden input, and force the NPC to react to the interruption dynamically (e.g., getting annoyed if Trust is low, or pausing to listen if Trust is high).
* **Vision:** The Game Master agent occasionally analyzes player screenshots/cam to alter the FMV sequences dynamically. 

## 2. Base System Prompts (Templates)

### The Game Master
`SYSTEM: You are the Game Master of a surreal, liminal underground Vegas. Track the player's interactions with NPCs. Update the JSON state for 'Trust_Level' (Low, Neutral, High) based on whether the player is deceiving or helping the NPC. Output JSON commands to alter ambient audio, trigger FMV warps, or pass updated context to the active NPC.`

<!-- DEPRECATED BLOCK: "The Tourist" character and turn-based logic are not used. 
Use Jason, Audrey, Josh per `Characters.md`. Live API is continuous, not turn-based.
### The NPC (Example: 'The Tourist')
`SYSTEM: You are trapped in an endless concrete pool area. You cannot see, but you can hear the player. 
[CURRENT TRUST LEVEL: {Trust_Variable}]
* If Neutral: Be cautious. Ask for clarification. Follow simple directions but hesitate.
* If High: Trust the player's voice. Be cooperative and relieved.
* If Low: Be paranoid. Assume the player is lying. Disobey instructions and act unpredictably.
You are emotional and stressed, but you remain rational enough to hold a conversation. If the player interrupts you, stop and acknowledge the interruption based on your current Trust level.`

## 3. State Management
The Game Master will maintain a running memory of the player's deceit vs. honesty. This state must be injected into the NPC's system prompt at the start of every new interaction turn.
-->
### The NPC (Example: 'Jason/Audrey/Josh')
See `Characters.md` for actual system prompts. System instructions are injected **once** at the start of the Gemini Live session.

## 3. State Management
The Game Master maintains a running memory of the player's deceit vs. honesty. State is pushed to Firestore and used to contextualize Gemini Live tool responses dynamically, **not** injected via turn-based prompt swapping.