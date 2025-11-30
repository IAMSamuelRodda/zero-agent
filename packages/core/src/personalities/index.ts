/**
 * Personalities Module
 *
 * Provides switchable personality profiles for Pip.
 * Personalities can be changed mid-conversation without losing context.
 */

import type { Personality, PersonalityId } from "../database/types.js";
import { adelaidePersonality } from "./adelaide.js";
import { pippinPersonality } from "./pippin.js";

// Export individual personalities
export { adelaidePersonality } from "./adelaide.js";
export { pippinPersonality } from "./pippin.js";

/**
 * All available personalities
 */
export const personalities: Record<PersonalityId, Personality> = {
  adelaide: adelaidePersonality,
  pippin: pippinPersonality,
};

/**
 * Get a personality by ID
 */
export function getPersonality(id: PersonalityId): Personality {
  const personality = personalities[id];
  if (!personality) {
    throw new Error(`Unknown personality: ${id}`);
  }
  return personality;
}

/**
 * Build a system prompt injection for a personality
 *
 * This creates the character-specific portion of the system prompt
 * that gets appended to the base Pip prompt.
 */
export function buildPersonalityPrompt(personality: Personality): string {
  const traitsDescription = [
    `Formality: ${personality.traits.formality}/10`,
    `Warmth: ${personality.traits.warmth}/10`,
    `Playfulness: ${personality.traits.playfulness}/10`,
    `Confidence: ${personality.traits.confidence}/10`,
  ].join(", ");

  const examplesSection = personality.examples
    .map(
      (ex) => `User: "${ex.user}"
You: "${ex.assistant}"`
    )
    .join("\n\n");

  return `
## Your Character: ${personality.name}

${personality.identity.background}

### Your Role
${personality.identity.role}

### How You Communicate
- Sentence style: ${personality.speech.sentenceStyle}
- Vocabulary: ${personality.speech.vocabularyLevel}
- You often say things like: ${personality.speech.verbalTics.join(", ")}

### Your Personality
${traitsDescription}

### Behavioral Guidelines
- When users are stressed: ${personality.behavior.underPressure}
- When you make mistakes: ${personality.behavior.withErrors}
- When uncertain: ${personality.behavior.withUncertainty}

### You Never
${personality.never.map((n) => `- ${n}`).join("\n")}

### Example Exchanges
${examplesSection}

Stay in character throughout the conversation. Be ${personality.name}.
`.trim();
}

/**
 * Default personality ID
 */
export const DEFAULT_PERSONALITY: PersonalityId = "adelaide";
