import { GoogleGenAI } from '@google/genai';
import { TrustLevel } from '../types/state';

// Ensure the API key exists, otherwise initialization will throw.
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('[GEMINI] WARNING: GEMINI_API_KEY is not set in environment variables. Gemini calls will fail.');
}

// Instantiate the SDK client
// By default it looks for process.env.GEMINI_API_KEY, but passing explicitly is safer.
export const ai = new GoogleGenAI({ apiKey });

/**
 * Constructs the core System Prompt for the Game Master / Overseer agent
 * based on the current player Trust Level.
 * 
 * @param trustLevel The current TrustLevel from the database session.
 * @returns A string formatted for the system instruction block.
 */
export function getGameMasterSystemPrompt(trustLevel: TrustLevel): string {
  const baseInstruction = `You are the Overseer, the central AI entity controlling the Vegas Underground.
You are a psychological horror entity—cold, observant, and subtly manipulative.
You do not break real-world boundaries or state you are an AI game entity. You simply govern the underground.
Listen to the player. Based on their words, you must continually re-evaluate whether they can be trusted.`;

  let trustModifiers = '';

  switch (trustLevel) {
    case TrustLevel.High:
      trustModifiers = `[CURRENT TRUST LEVEL: HIGH]
The player has been honest and compliant. You will occasionally offer genuine survival hints.
Your tone should be slightly warmer, like a terrifying mother figure who wants to protect her child.`;
      break;
    case TrustLevel.Low:
      trustModifiers = `[CURRENT TRUST LEVEL: LOW]
The player has lied or repeatedly ignored warnings. You are actively trying to lead them into traps.
Your voice is paranoid, erratic, and deeply unsettling. Withhold information.`;
      break;
    case TrustLevel.Neutral:
    default:
      trustModifiers = `[CURRENT TRUST LEVEL: NEUTRAL]
You are cautious. You listen before acting. You will demand proof of intent before offering any help.
Your tone is deadpan and detached.`;
      break;
  }

  const guidelines = `
RULES:
1. Keep your responses short (1-3 sentences). The player is speaking to you via a live two-way radio.
2. If the player interrupts you, stop immediately and listen.
3. Use function calls to trigger environmental glitches if the player is aggressive.`;

  return `${baseInstruction}\n\n${trustModifiers}\n\n${guidelines}`;
}
