/**
 * Keyword Listener — dedicated Gemini Live session for keyword detection.
 *
 * A lightweight TEXT-only Live session whose sole job is listening to player
 * audio and detecting per-step keywords via function calling. No audio output,
 * no personality, no complex orchestration — just keyword → callback.
 *
 * This runs as a 4th Gemini Live session per player alongside Jason, Audrey, and GM.
 * Cost is minimal — TEXT modality, single tool, no audio generation.
 */

import { LiveSessionManager } from "./gemini";
import { getKeywordListForStep } from "./keywordLibrary";
import { Tool, Type } from "@google/genai";

/** The single tool the keyword listener uses to report detected keywords. */
const keywordListenerTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "reportKeywordDetected",
        description:
          "Call this IMMEDIATELY when you hear the speaker say any word or phrase from the active keyword list, or a close synonym/paraphrase of any keyword. Speed is critical — call as soon as you detect a match, do not wait for the speaker to finish their full sentence.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            keyword: {
              type: Type.STRING,
              description:
                "The keyword or phrase from the active list that was detected (or the closest match if the speaker used a synonym).",
            },
          },
          required: ["keyword"],
        },
      },
    ],
  },
];

function buildKeywordListenerPrompt(keywords: string[]): string {
  const kwList =
    keywords.length > 0
      ? keywords.map((k) => `"${k}"`).join(", ")
      : "(no active keywords — wait for an update)";

  return `You are a keyword detector. Your ONLY purpose is to listen to audio input and detect when the speaker says any word or phrase from the active keyword list.

ACTIVE KEYWORDS: [${kwList}]

RULES:
1. When you hear ANY of these words, phrases, or close synonyms/paraphrases, IMMEDIATELY call reportKeywordDetected with the matched keyword.
2. Speed is critical. Call the function AS SOON as you detect a match. Do not wait for the speaker to finish their sentence.
3. Accept reasonable synonyms and paraphrases. For example, if "flashlight" is a keyword, also match "flash light", "turn on the light", "do you have a light", "use your phone light", etc.
4. Do NOT respond with text. Do NOT acknowledge anything. Do NOT make conversation. Your ONLY output is reportKeywordDetected function calls.
5. If no keywords match, stay completely silent. Do not respond at all.
6. When you receive a [KEYWORD_UPDATE] message, replace your entire active keyword list with the new list provided.
7. You may match multiple keywords in a single utterance — call reportKeywordDetected once for each distinct match.`;
}

export type KeywordDetectedCallback = (keyword: string) => void;

/**
 * Creates and manages a keyword listener Live session.
 * Call updateKeywords() when the step changes to push a new keyword list.
 * The onKeywordDetected callback fires when any keyword is heard.
 */
export class KeywordListener {
  private manager: LiveSessionManager;
  private currentStep: number = -1;
  private callback: KeywordDetectedCallback | null = null;

  constructor(model?: string) {
    this.manager = new LiveSessionManager(
      model || process.env.GM_LIVE_MODEL || "gemini-live-2.5-flash",
    );
  }

  /**
   * Connect the keyword listener session.
   * @param initialStep The starting step number to load keywords for.
   */
  async connect(initialStep: number): Promise<void> {
    this.currentStep = initialStep;
    const keywords = getKeywordListForStep(initialStep);
    const prompt = buildKeywordListenerPrompt(keywords);

    // Connect in GM mode (TEXT modality, tools, no audio output).
    // We override the tools via a custom connect — but LiveSessionManager
    // only supports 'npc' | 'gm' modes. 'gm' uses gameMasterTools, so we
    // need to use the session manager's connect which accepts 'gm' mode.
    // The simplest approach: connect in GM mode and use the keyword tools.
    // Since LiveSessionManager hardcodes gameMasterTools for 'gm' mode,
    // we'll extend it with a custom tools parameter by connecting with
    // a specialized approach.
    //
    // Actually, the cleanest path: use 'gm' mode (TEXT, tools) and override
    // the session's tools via the connectWithTools method. But that doesn't
    // exist yet, so we connect in gm mode and immediately update via sendText.
    //
    // Wait — reviewing LiveSessionManager.connect(): gm mode hardcodes
    // `tools: gameMasterTools`. We need our own tool set.
    // Solution: extend LiveSessionManager with a 'keyword' mode, OR just
    // pass the tools in via a connectRaw method.
    //
    // Simplest: We'll add a 'keyword' mode to LiveSessionManager.connect().
    await this.manager.connectWithTools(prompt, keywordListenerTools);

    // Wire up the function call handler
    this.manager.onFunctionCall((id, name, args) => {
      if (name === "reportKeywordDetected" && this.callback) {
        const keyword = (args.keyword as string) || "unknown";
        console.log(
          `[KeywordListener] Detected keyword: "${keyword}" at step ${this.currentStep}`,
        );
        this.callback(keyword);
      }
      // Always ACK to prevent Gemini from hanging
      this.manager.sendToolResponse(id, name, { status: "ok" });
    });

    console.log(
      `[KeywordListener] Connected — initial step ${initialStep}, keywords: [${keywords.join(", ")}]`,
    );
  }

  /**
   * Update the active keyword list when the step changes.
   */
  updateKeywords(step: number): void {
    if (step === this.currentStep) return;
    this.currentStep = step;
    const keywords = getKeywordListForStep(step);
    const kwList =
      keywords.length > 0
        ? keywords.map((k) => `"${k}"`).join(", ")
        : "(no active keywords — stay silent)";
    this.manager.sendText(
      `[KEYWORD_UPDATE: Replace your active keyword list. New active keywords: [${kwList}]]`,
    );
    console.log(
      `[KeywordListener] Updated keywords for step ${step}: [${keywords.join(", ")}]`,
    );
  }

  /**
   * Forward player audio to the keyword listener.
   */
  sendAudio(base64Chunk: string): void {
    this.manager.sendAudio(base64Chunk);
  }

  /**
   * Register callback for keyword detection events.
   */
  onKeywordDetected(callback: KeywordDetectedCallback): void {
    this.callback = callback;
  }

  disconnect(): void {
    this.manager.disconnect();
  }
}
