/**
 * Topic Generation System
 * 
 * Generates personalized topic options based on learner profile.
 * Uses Gemini 3 (low reasoning) for intelligent, fast topic selection.
 */

import type { LearnerProfile, SkillDimensionName } from '@/types/database-helpers';
import type { GeneratedTopic } from '@/types/session';

// Extensive topic pool across many domains (1-2 word seeds)
const TOPIC_SEEDS = {
  psychology: [
    'dreams', 'habits', 'memory', 'emotions', 'motivation', 'perception', 'bias', 
    'persuasion', 'identity', 'creativity', 'intuition', 'attention', 'language', 
    'consciousness', 'decision-making', 'social influence', 'personality', 'trauma'
  ],
  philosophy: [
    'free will', 'morality', 'truth', 'beauty', 'justice', 'meaning', 'existence',
    'knowledge', 'time', 'mind', 'logic', 'ethics', 'virtue', 'happiness', 'death',
    'art', 'love', 'power', 'rights', 'identity'
  ],
  physics: [
    'light', 'gravity', 'time', 'energy', 'atoms', 'waves', 'magnetism', 'heat',
    'motion', 'sound', 'electricity', 'space', 'matter', 'forces', 'entropy',
    'relativity', 'quantum', 'black holes', 'particles', 'radiation'
  ],
  biology: [
    'evolution', 'cells', 'DNA', 'aging', 'sleep', 'pain', 'viruses', 'immunity',
    'ecosystems', 'instincts', 'senses', 'growth', 'death', 'reproduction', 'brains',
    'metabolism', 'bacteria', 'adaptation', 'symbiosis', 'extinction'
  ],
  history: [
    'empires', 'revolutions', 'wars', 'trade', 'migrations', 'plagues', 'inventions',
    'religions', 'democracy', 'slavery', 'colonialism', 'industrialization', 'cities',
    'writing', 'money', 'law', 'exploration', 'nationalism', 'propaganda', 'resistance'
  ],
  economics: [
    'markets', 'money', 'trade', 'inequality', 'growth', 'inflation', 'debt',
    'incentives', 'scarcity', 'value', 'competition', 'monopolies', 'bubbles',
    'labor', 'poverty', 'wealth', 'prices', 'banks', 'globalization', 'taxation'
  ],
  technology: [
    'AI', 'internet', 'algorithms', 'encryption', 'automation', 'data', 'networks',
    'software', 'hardware', 'innovation', 'privacy', 'surveillance', 'platforms',
    'computing', 'robotics', 'biotechnology', 'energy', 'communication', 'simulation'
  ],
  sociology: [
    'culture', 'norms', 'power', 'class', 'gender', 'race', 'institutions',
    'movements', 'media', 'cities', 'families', 'education', 'crime', 'religion',
    'communities', 'identity', 'inequality', 'conformity', 'deviance', 'rituals'
  ],
  politics: [
    'democracy', 'power', 'voting', 'propaganda', 'corruption', 'diplomacy',
    'ideology', 'rights', 'protest', 'leadership', 'nationalism', 'justice',
    'freedom', 'authority', 'conflict', 'cooperation', 'borders', 'citizenship'
  ],
  arts: [
    'music', 'painting', 'literature', 'film', 'architecture', 'dance', 'theatre',
    'poetry', 'sculpture', 'photography', 'design', 'fashion', 'storytelling',
    'symbolism', 'style', 'creativity', 'expression', 'beauty', 'taste'
  ],
  mathematics: [
    'infinity', 'probability', 'patterns', 'proof', 'numbers', 'geometry', 'chaos',
    'statistics', 'logic', 'puzzles', 'games', 'optimization', 'networks', 'symmetry'
  ],
  environment: [
    'climate', 'pollution', 'biodiversity', 'resources', 'sustainability', 'oceans',
    'forests', 'energy', 'waste', 'conservation', 'weather', 'agriculture'
  ]
};

// Example topic framings (how to turn seeds into compelling questions)
const FRAMING_EXAMPLES = `
EXCELLENT TOPIC FRAMINGS:
- "Why do we dream?" (from 'dreams') - Open, universal, invites exploration
- "Can habits be unlearned?" (from 'habits') - Yes/no framing that opens deeper inquiry
- "How do economies collapse?" (from 'markets') - Process question, dramatic hook
- "What makes music emotional?" (from 'music') - Bridges subjective experience with mechanisms
- "Could we live forever?" (from 'aging') - Provocative, interdisciplinary
- "Why do revolutions happen?" (from 'revolutions') - Causal question, historical grounding
- "Is free will an illusion?" (from 'free will') - Challenges assumptions
- "How does language shape thought?" (from 'language') - Connects two domains
- "What makes a leader?" (from 'leadership') - Accessible but deep
- "Why do we laugh?" (from 'emotions') - Universal experience, surprising depth

FOR NEW/CASUAL USERS - be careful with:
- Very narrow without hook: "The Treaty of Westphalia" → better: "How one treaty invented nation-states"
- Too broad: "History" → needs an angle
- Dry without context: "Polynomial equations" → better: "Why can't we solve every equation?"
- Jargon-heavy: "Epistemic justification" → better: "How do we know what we know?"

FOR ADVANCED/RETURNING USERS - these CAN work:
- Specific topics if they match interests: "The Treaty of Westphalia" is great for a history enthusiast
- Academic framing if they've shown philosophical interest
- Technical topics if they've engaged well with complexity before
- The key is matching difficulty to demonstrated engagement level
`;

/**
 * Generate 3 topic options tailored to the learner using Gemini 3
 */
export async function generateTopics(
  profile: LearnerProfile,
  sessionCount: number
): Promise<GeneratedTopic[]> {
  
  const prompt = buildTopicGenerationPrompt(profile, sessionCount);
  
  try {
    // Use Gemini 3 with low reasoning for speed
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            thinkingConfig: {
              thinkingLevel: 'low'  // Fast responses
            },
            responseMimeType: 'application/json',
            responseJsonSchema: {
              type: 'object',
              properties: {
                topics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      difficulty: { type: 'string', enum: ['accessible', 'moderate', 'challenging'] },
                      cognitive_focus: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['id', 'title', 'description', 'difficulty', 'cognitive_focus']
                  }
                }
              },
              required: ['topics']
            }
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Topic generation failed:', await response.text());
      return getDefaultTopics();
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return getDefaultTopics();
    }

    const parsed = JSON.parse(content);
    return parsed.topics || getDefaultTopics();
    
  } catch (error) {
    console.error('Topic generation error:', error);
    return getDefaultTopics();
  }
}

/**
 * Build the prompt for topic generation
 */
function buildTopicGenerationPrompt(profile: LearnerProfile, sessionCount: number): string {
  const recentTopics = profile.recent_topics?.join(', ') || 'None';
  const interests = profile.interest_tags?.join(', ') || 'Unknown';
  const knownTopics = profile.known_topics?.map(t => t.name).join(', ') || 'None';
  const openLoops = profile.open_loops?.map(l => l.content).join('; ') || 'None';
  
  
  // Select a random subset of domains to mention (to add variety)
  const allDomains = Object.keys(TOPIC_SEEDS);
  const shuffledDomains = allDomains.sort(() => Math.random() - 0.5);
  const selectedDomains = shuffledDomains.slice(0, 6);
  
  // Get topic seeds for those domains
  const seedSamples = selectedDomains.map(domain => {
    const seeds = TOPIC_SEEDS[domain as keyof typeof TOPIC_SEEDS];
    const shuffled = [...seeds].sort(() => Math.random() - 0.5);
    return `${domain}: ${shuffled.slice(0, 5).join(', ')}`;
  }).join('\n');

  return `You are generating 3 topic options for an Oxford-style voice tutorial.

LEARNER CONTEXT:
- Session count: ${sessionCount}
- Interests: ${interests}
- Known topics: ${knownTopics}
- Recent topics (avoid direct repetition): ${recentTopics}
- Open loops (curiosity expressed in past sessions): ${openLoops}

TOPIC SEED POOL (sample from today's selection):
${seedSamples}

${FRAMING_EXAMPLES}

GUIDELINES:
1. Generate 3 DIVERSE topic options - from different domains if possible
2. Avoid recent topics - offer fresh angles even if returning to a domain
3. If there are open loops, consider addressing one (but don't force it)
4. Each should invite Socratic exploration - not just lecture material
5. Frame topics as questions or hooks that create curiosity

CALIBRATE DIFFICULTY - USE YOUR JUDGMENT:
Session count (${sessionCount}) is just ONE signal. Also consider:
- Known topics: ${knownTopics} (indicates demonstrated knowledge level)
- Interests: ${interests} (specific interests suggest readiness for depth in those areas)
- Open loops: ${openLoops} (expressed curiosity suggests engagement)

HEURISTICS (not rigid rules):
- First session with NO profile data → default to accessible, broadly appealing
- Any session where interests/known topics suggest depth → offer at least one challenging option
- Strong stated interests in specific domain → can offer niche/specific topics in that domain
- Mix difficulty: consider offering 1 accessible + 1 moderate + 1 challenging option to let THEM choose

The goal is to offer topics that will ENGAGE this specific person, not to follow a formula.
If someone seems curious and capable, trust that - don't artificially limit complexity.

OUTPUT: Return exactly 3 topics with engaging titles and one-sentence hooks.`;
}

/**
 * Default topics if generation fails
 */
function getDefaultTopics(): GeneratedTopic[] {
  return [
    {
      id: 'default-1',
      title: 'Why do we dream?',
      description: 'Explore the science and mystery of dreams - from neural activity to meaning-making.',
      difficulty: 'accessible',
      cognitive_focus: ['explanatory', 'hypothetical'] as SkillDimensionName[]
    },
    {
      id: 'default-2', 
      title: 'How do ideas spread?',
      description: 'From rumors to revolutions - what makes some ideas catch fire while others fade?',
      difficulty: 'moderate',
      cognitive_focus: ['argumentation', 'transfer'] as SkillDimensionName[]
    },
    {
      id: 'default-3',
      title: 'What makes a good decision?',
      description: 'Unpack the psychology of choice - why we decide the way we do and how to do it better.',
      difficulty: 'moderate',
      cognitive_focus: ['metacognition', 'epistemic'] as SkillDimensionName[]
    }
  ];
}

/**
 * Generate topics synchronously from defaults (for fast fallback)
 */
export function getQuickTopics(): GeneratedTopic[] {
  return getDefaultTopics();
}
