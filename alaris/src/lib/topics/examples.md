# Topic Generation Guidelines

This file provides examples and guidelines for generating session topics.

## Core Principles

1. **Cognitively Rich**: Topics should invite argumentation, explanation, transfer, and hypothetical thinking
2. **Age-Appropriate**: Adjust complexity based on learner's age bracket
3. **Diverse**: Avoid repeating recent topics, span multiple domains
4. **Accessible**: No prior expert knowledge required, build from common ground
5. **Engaging**: Connect to real-world implications, contemporary relevance

## Example Topics by Domain

### History & Politics
- "Why did democracy emerge in some ancient civilizations but not others?"
- "What would have happened if the printing press was never invented?"
- "How do modern governments decide between individual freedom and collective safety?"

### Science & Nature
- "Why do some species have extreme adaptations (like peacock tails) that seem harmful?"
- "If you could only save one species from extinction, what factors would guide your choice?"
- "How do we know the Earth is really billions of years old?"

### Philosophy & Ethics
- "Is it ever okay to lie? When?"
- "If you could design a fair society from scratch, what rules would you start with?"
- "Can a computer ever truly think, or just follow instructions?"

### Economics & Society
- "Why do some countries become rich while others stay poor?"
- "Should life-saving medicines be sold for profit?"
- "How would society work without money?"

### Psychology & Learning
- "Why do people believe things that aren't true, even when shown evidence?"
- "What makes someone a good leader?"
- "Is talent mostly born or mostly built through practice?"

### Art & Culture
- "What makes something 'art' vs. just an object?"
- "Why do different cultures have such different ideas of beauty?"
- "Can fiction teach us truths that non-fiction can't?"

## Topic Structure

Each generated topic should include:

```typescript
{
  id: string;
  title: string; // Short, intriguing question or statement
  description: string; // 1-2 sentence elaboration
  difficulty_estimate: 'accessible' | 'moderate' | 'challenging';
  cognitive_focus: string[]; // e.g., ['argumentation', 'transfer', 'epistemic_humility']
}
```

## Anti-Patterns (Avoid These)

❌ Pure trivia: "What year did WWI start?"
❌ Too niche: "Explain quantum chromodynamics"
❌ Requires specialized knowledge: "Analyze this specific poem you haven't read"
❌ No room for thinking: "What is 2+2?"
❌ Too vague: "Let's talk about history"

## Personalization Notes

When generating topics for a specific learner:
- Check `recent_topics` array to avoid repetition
- Consider `interest_tags` to increase relevance
- Review `known_topics` to calibrate difficulty
- Look at `open_loops` for follow-up opportunities
- Adapt based on age_bracket (13-15 vs 16-18 vs 18+)

## TODO: Phase 3.2 Implementation

In Phase 3.2, create `src/lib/topics/generateTopics.ts` that:
1. Accepts learner profile as input
2. Calls GPT-4o/GPT-5 with this guidelines file as context
3. Returns 3 diverse, personalized topic options
4. Ensures topics avoid recent_topics array

