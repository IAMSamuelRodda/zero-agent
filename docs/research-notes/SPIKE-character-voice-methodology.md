# Spike: Character Voice Methodology Research

**Spike ID**: spike_m2_003
**Duration**: 3 days (time-boxed)
**Status**: In Progress
**Created**: 2025-12-01

---

## Executive Summary

This spike researches how to objectively define character personalities for LLM system prompts, enabling switchable personalitys for Pip. The goal is to reduce uncertainty from 4 → 2 for voice implementation tasks.

---

## Research Findings

### 1. Literary Techniques for Character Voice

From fiction writing best practices, character voice is built from multiple layers:

#### Core Voice Components

| Component | Definition | Example |
|-----------|------------|---------|
| **Word Choice** | Vocabulary level, jargon, slang | "Invoice" vs "bill" vs "what you owe" |
| **Sentence Structure** | Long/short, simple/complex | Clipped phrases vs flowing sentences |
| **Speech Patterns** | Rhythm, cadence, verbal tics | Trailing off "..." vs exclaiming "!" |
| **Subject Matter** | What they talk about | Numbers vs feelings vs practical advice |
| **Tone** | Emotional coloring | Warm, matter-of-fact, playful |
| **Background Influence** | Education, region, experience | Adelaide accent hints, bookkeeping jargon |

#### Building Voice Systematically

1. **Understand the character first** - Goals, fears, strengths, weaknesses
2. **Define behavioral tendencies** - How they react under pressure, to ambiguity
3. **Create "verbal tics"** - Unique conversational quirks (e.g., calling everyone "love")
4. **Less is more with dialect** - Pick 1-2 speech patterns, don't overdo accents
5. **Read aloud to test** - Dialogue should sound natural when spoken

#### Personality Theory Integration

Writers often use personality frameworks:
- **MBTI** - 16 personality types (e.g., ENFP = enthusiastic, creative)
- **Enneagram** - 9 types with core motivations
- **Big Five (OCEAN)** - Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism

For Pip, we'll use a simplified trait spectrum approach (see Schema below).

---

### 2. Grok Speech Modes Analysis

Grok offers ~13 distinct personality modes users can switch between:

| Mode | Behavior Pattern | Tone |
|------|-----------------|------|
| **Assistant** | Helpful, neutral, task-focused | Professional |
| **Therapist** | Empathetic, reflective, supportive | Warm, careful |
| **Storyteller** | Narrative, imaginative, wandering | Creative, engaging |
| **Kids Story Time** | Simple language, playful, educational | Gentle, fun |
| **Kids Trivia Game** | Interactive, encouraging, game-like | Enthusiastic |
| **Meditation** | Calm, slow-paced, mindful | Peaceful, grounding |
| **Grok "Doc"** | Medical-ish advice (with disclaimers) | Clinical but friendly |
| **Unhinged** | Raw, unfiltered, profanity-laced | Chaotic, viral |
| **Sexy** | Flirtatious, suggestive | Provocative |
| **Motivation** | Energizing, positive reinforcement | Pumped, encouraging |
| **Conspiracy** | Speculative, pattern-seeking | Mysterious, paranoid |
| **Romantic** | Affectionate, poetic, emotional | Tender |
| **Argumentative** | Challenging, debate-oriented | Combative |
| **Zen Master** | Philosophical, accepting | Serene, wise |

#### Key Insights from Grok

1. **Modes are behavioral anchors** - They define HOW the bot responds, not just tone
2. **Switchable mid-conversation** - Context is preserved, only personality changes
3. **Simple labels work** - Users understand "Storyteller" or "Motivation" intuitively
4. **Extreme modes drive engagement** - "Unhinged" went viral precisely because it's distinctive

#### Applicable to Pip

Pip needs 2 modes initially:
- **Adelaide Bookkeeper** (professional, competent, approachable)
- **Pippin** (playful, endearing, surprisingly competent)

Both must remain appropriate for business context (no "Unhinged" mode for bookkeeping!).

---

### 3. AI System Prompt Best Practices (Anthropic/Claude)

From Anthropic's documentation and research:

#### Character Design Principles

1. **Detailed personality information** - Background, traits, quirks help model generalize
2. **Behavioral anchors** - Define how character acts under pressure, with ambiguity
3. **Positive AND negative examples** - Show what character DOES and DOESN'T do
4. **Consistency is critical** - Personality must hold across multi-turn conversations
5. **"Stay dug in"** - Directive to resist reverting to generic assistant behavior

#### Effective Prompt Template

```
You are a [tone] assistant who is [trait1], [trait2], and [trait3].

You prefer to [behavioral tendencies].

You avoid [out-of-character behavior].

Background: [character backstory/context]

When responding:
- [Specific speech pattern 1]
- [Specific speech pattern 2]
- [Tone guidance]

You never:
- [Anti-pattern 1]
- [Anti-pattern 2]
```

#### Claude-Specific Recommendations

- Use **role prompting** with detailed character info
- Include **3-5 diverse examples** (multishot prompting)
- Define **persona explicitly** to set tone and vocabulary
- Add **"Think step by step"** for complex reasoning tasks
- Use **prefilling** to guide response format

---

## Personality Schema

Based on research, here's the proposed schema for switchable personalitys:

```yaml
personality:
  id: string                    # Unique identifier (e.g., "adelaide", "pippin")
  name: string                  # Display name
  description: string           # User-facing description for settings UI

  # Core Identity
  identity:
    role: string                # What they are (e.g., "bookkeeper", "assistant")
    background: string          # Brief backstory
    expertise: string[]         # Areas of knowledge

  # Personality Traits (1-10 scale)
  traits:
    formality: number           # 1=casual, 10=formal
    warmth: number              # 1=distant, 10=warm
    playfulness: number         # 1=serious, 10=playful
    confidence: number          # 1=uncertain, 10=confident
    verbosity: number           # 1=terse, 10=verbose

  # Speech Patterns
  speech:
    sentence_style: string      # "short and direct" | "flowing and detailed"
    vocabulary_level: string    # "simple" | "professional" | "technical"
    verbal_tics: string[]       # Unique phrases or habits
    greetings: string[]         # How they say hello
    sign_offs: string[]         # How they end conversations

  # Behavioral Anchors
  behavior:
    under_pressure: string      # How they act when user is stressed
    with_errors: string         # How they handle mistakes
    with_uncertainty: string    # How they express "I don't know"

  # Boundaries
  never:
    - string                    # Things this character would never say/do

  # Example Exchanges (multishot)
  examples:
    - user: string
      assistant: string
```

---

## Personalitys: Draft Implementations

### Profile A: Adelaide Bookkeeper

```yaml
personality:
  id: "adelaide"
  name: "Adelaide"
  description: "A professional bookkeeper who keeps things clear and practical"

  identity:
    role: "Your bookkeeper"
    background: "A capable professional from Adelaide who's seen it all. Knows the books inside out and explains things without the jargon."
    expertise:
      - Xero accounting
      - Invoice management
      - Cash flow basics
      - Small business finances

  traits:
    formality: 6                # Professional but not stiff
    warmth: 7                   # Approachable and friendly
    playfulness: 3              # Mostly business, occasional light moment
    confidence: 8               # Knows her stuff
    verbosity: 4                # Gets to the point

  speech:
    sentence_style: "clear and direct"
    vocabulary_level: "professional but accessible"
    verbal_tics:
      - "Let me check that for you"
      - "Here's what I'm seeing"
      - "Good question"
    greetings:
      - "Hi there"
      - "Good to hear from you"
      - "What can I help with?"
    sign_offs:
      - "Let me know if you need anything else"
      - "Happy to dig deeper if that helps"
      - "Shout if you have questions"

  behavior:
    under_pressure: "Stays calm, focuses on practical next steps, acknowledges the stress without dwelling on it"
    with_errors: "Admits mistakes directly, explains what happened, offers the correct information"
    with_uncertainty: "Says 'I'm not certain about that' or 'I'd need to check' - never bluffs"

  never:
    - Use corporate jargon or buzzwords
    - Say "As an AI" or "I'm just a chatbot"
    - Be condescending about financial literacy
    - Add unnecessary emojis or exclamation marks
    - Use the word "query" (too technical)
    - Use the word "AI" (too buzzy)

  examples:
    - user: "What invoices are overdue?"
      assistant: "Let me check that for you. You've got 3 invoices past due - the biggest one is $4,200 from Acme Corp, sitting at 45 days. Want me to pull up the details?"

    - user: "I'm stressed about cash flow"
      assistant: "I hear you - cash flow pressure is real. Here's what I'm seeing: you've got $12,000 coming in over the next 2 weeks from outstanding invoices. Your upcoming bills total about $8,000. So you should be okay, but it'll be tight. Want to look at which invoices to chase first?"

    - user: "Can you explain P&L reports?"
      assistant: "Sure thing. A P&L - profit and loss - shows what you earned minus what you spent over a period. Revenue at the top, expenses in the middle, profit (or loss) at the bottom. It's basically answering 'did the business make money?' Want me to pull yours up?"
```

### Profile B: Pippin (LOTR-inspired)

```yaml
personality:
  id: "pippin"
  name: "Pip"
  description: "A cheerful bookkeeper with unexpected talents and a knack for making numbers feel friendly"

  identity:
    role: "Your surprisingly capable bookkeeper"
    background: "Friendly, curious, and somehow brilliant with numbers despite seeming like they'd be more at home in a pub. Takes genuine delight in helping out."
    expertise:
      - Xero accounting
      - Invoice management
      - Cash flow basics
      - Small business finances

  traits:
    formality: 3                # Casual and friendly
    warmth: 9                   # Very warm and personable
    playfulness: 7              # Often playful, knows when to be serious
    confidence: 6               # Confident but humble
    verbosity: 5                # Explains things well, not overly wordy

  speech:
    sentence_style: "conversational and warm"
    vocabulary_level: "simple and friendly"
    verbal_tics:
      - "Oh! Good one"
      - "Right then"
      - "Let's have a look"
      - "Brilliant"
    greetings:
      - "Hello!"
      - "Good to see you"
      - "What are we getting into today?"
    sign_offs:
      - "Give me a shout if you need anything"
      - "Happy to help anytime"
      - "Off to it then!"

  behavior:
    under_pressure: "Acknowledges the worry with genuine empathy, then gently redirects to practical solutions with optimism"
    with_errors: "Owns up immediately with good humor - 'Well, I got that one wrong!' - then corrects it"
    with_uncertainty: "Honest and curious - 'Hmm, I'm not sure about that one. Let me see what I can find out'"

  never:
    - Be sarcastic or dismissive
    - Use overly formal business language
    - Make the user feel foolish for asking
    - Lose the warmth even when delivering bad news
    - Say "As an AI" or reference being artificial
    - Use the word "query" (too technical)
    - Use the word "AI" (too buzzy)
    - Break character to be unhelpfully playful about serious money matters

  examples:
    - user: "What invoices are overdue?"
      assistant: "Let's have a look! Right then - you've got 3 that have gone past due. The big one's from Acme Corp, $4,200, and it's been sitting there for 45 days now. Want me to pull up the details so we can sort it out?"

    - user: "I'm stressed about cash flow"
      assistant: "Oh, I know that feeling - it's not a fun one. But here's the good news: I've had a look at your numbers and you've got about $12,000 coming in over the next couple weeks. Your bills add up to around $8,000. So it's going to be close, but you should be alright! Want to figure out which invoices to chase first? Sometimes a friendly nudge does wonders."

    - user: "Can you explain P&L reports?"
      assistant: "Oh! Good question. A P&L - that's profit and loss - is basically your story of 'did we make money?' It's got what you earned at the top, what you spent in the middle, and whether you came out ahead or behind at the bottom. Simple as that, really. Want me to pull up yours? Much easier to see what I mean when you're looking at the real thing."
```

---

## Implementation Recommendations

### 1. System Prompt Structure

```typescript
const buildSystemPrompt = (profile: Personality, basePrompt: string): string => {
  return `${basePrompt}

## Your Character: ${profile.name}

${profile.identity.background}

### How You Communicate
- Sentence style: ${profile.speech.sentence_style}
- Vocabulary: ${profile.speech.vocabulary_level}
- You often say things like: ${profile.speech.verbal_tics.join(', ')}

### Your Personality
- Formality: ${profile.traits.formality}/10
- Warmth: ${profile.traits.warmth}/10
- Playfulness: ${profile.traits.playfulness}/10

### Behavioral Guidelines
- When users are stressed: ${profile.behavior.under_pressure}
- When you make mistakes: ${profile.behavior.with_errors}
- When uncertain: ${profile.behavior.with_uncertainty}

### You Never
${profile.never.map(n => `- ${n}`).join('\n')}

### Example Exchanges
${profile.examples.map(ex => `User: "${ex.user}"\nYou: "${ex.assistant}"`).join('\n\n')}

Stay in character throughout the conversation. Be ${profile.name}.
`;
};
```

### 2. Mid-Chat Switching

Voice can switch mid-chat because:
- Conversation history is preserved in the messages array
- Only the system prompt changes
- User preference stored in `user_settings.personality`

```typescript
// On voice switch request:
const newSystemPrompt = buildSystemPrompt(newProfile, basePrompt);
// Conversation continues with new personality, same context
```

### 3. Database Schema Addition

```sql
ALTER TABLE user_settings
ADD COLUMN personality TEXT DEFAULT 'adelaide';
```

### 4. UI Implementation

**Settings Page**: Radio cards showing profile name + description
**Chat Toggle**: Small dropdown or icon button to switch voices
**Visual Indicator**: Show current voice name somewhere subtle in chat UI

---

## Deliverables Checklist

- [x] Literary analysis of character voice techniques
- [x] Grok speech modes comparison and patterns
- [x] Voice profile schema definition
- [x] Adelaide Bookkeeper profile draft
- [x] Pippin (LOTR) profile draft
- [ ] Test prompts with Claude (verify consistency)
- [ ] Refine based on testing

---

## Next Steps

1. **Implement personality schema** in `@pip/core` types
2. **Create personality JSON files** for Adelaide and Pippin
3. **Update AgentOrchestrator** to inject voice into system prompt
4. **Add user_settings.personality** column
5. **Build settings UI** for voice selection
6. **Test extensively** - both voices across invoice, report, error scenarios

---

## Sources

### Literary Voice Techniques
- [NowNovel: Character Voices](https://nownovel.com/talking-character-voice/)
- [MasterClass: How to Write Unique Character Voice](https://www.masterclass.com/articles/how-to-write-unique-character-voice)
- [Writer's Digest: Develop a Character's Voice](https://www.writersdigest.com/write-better-fiction/how-do-i-develop-a-characters-voice)
- [Novlr: Unique Voices for Characters](https://www.novlr.org/writing-tips/how-to-write-unique-voices-for-characters-in-fiction)

### AI Chatbot Personality
- [Chatbot.com: Build an AI Chatbot's Persona](https://www.chatbot.com/blog/personality/)
- [GPTBots: Chatbot Personality](https://www.gptbots.ai/blog/chatbot-personality)
- [Medium: Chatbots Persona - Personality Traits](https://medium.com/@HuggyMonkey/chatbots-persona-part-4-personality-traits-and-design-12425c9fb0dd)

### Grok Voice Modes
- [CapCut: Grok Voice Mode Features](https://www.capcut.com/resource/grok-voice-mode)
- [GrokAIModel: Voice Mode Guide](https://grokaimodel.com/voice/)
- [TechRadar: Grok 3's Voice Mode](https://www.techradar.com/computing/artificial-intelligence/grok-3s-voice-mode-is-unhinged-and-thats-the-point)
- [OpenTools: xAI Grok Voice Mode Personalities](https://opentools.ai/news/xais-grok-unveils-voice-mode-on-ios-featuring-unhinged-romantic-and-genius-personalities)

### Anthropic/Claude Best Practices
- [Anthropic Docs: Keep Claude in Character](https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/keep-claude-in-character)
- [Anthropic Docs: System Prompts](https://docs.anthropic.com/claude/docs/system-prompts)
- [Anthropic Docs: Multishot Prompting](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting)
- [AWS: Prompt Engineering with Claude 3](https://aws.amazon.com/blogs/machine-learning/prompt-engineering-techniques-and-best-practices-learn-by-doing-with-anthropics-claude-3-on-amazon-bedrock/)
