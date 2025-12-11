/**
 * Topic Generation System
 * 
 * Generates personalized topic options based on learner profile.
 * Uses GPT-4o/GPT-5 for intelligent topic selection.
 */

import type { LearnerProfile, SkillDimensionName } from '@/types/database-helpers';
import type { GeneratedTopic } from '@/types/session';

/**
 * Generate 3 topic options tailored to the learner
 */
export async function generateTopics(
  profile: LearnerProfile,
  sessionCount: number
): Promise<GeneratedTopic[]> {
  
  const prompt = buildTopicGenerationPrompt(profile, sessionCount);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8, // Some creativity for diverse topics
      }),
    });

    if (!response.ok) {
      console.error('Topic generation failed:', await response.text());
      return getDefaultTopics();
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
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
  
  const isNewUser = sessionCount < 3;
  
  return `You are generating topic options for an Oxford-style voice tutorial.

LEARNER CONTEXT:
- Session count: ${sessionCount} (${isNewUser ? 'NEW USER - keep topics accessible and engaging' : 'returning user'})
- Interests: ${interests}
- Known topics: ${knownTopics}
- Recent topics (AVOID these): ${recentTopics}
- Open loops (curiosity expressed): ${openLoops}

GUIDELINES:
1. Generate 3 diverse topic options
2. AVOID recent topics - offer fresh material
3. If there are open loops, consider addressing one
4. Topics should be intellectually rich but accessible
5. Each should offer opportunity for Socratic exploration
6. Consider interdisciplinary connections
7. ${isNewUser ? 'For new users: start with widely appealing, accessible topics' : 'For returning users: can go deeper or more niche'}

GOOD TOPIC EXAMPLES:
- "Why do we dream?" (psychology, neuroscience, philosophy)
- "How do economies collapse?" (history, economics, systems thinking)
- "What makes music emotional?" (neuroscience, culture, aesthetics)
- "Could we live forever?" (biology, ethics, technology)
- "Why do revolutions happen?" (history, politics, sociology)

BAD TOPIC EXAMPLES (too narrow or academic):
- "The Treaty of Westphalia" (too specific without hook)
- "Polynomial equations" (too dry without context)
- "The French Revolution" (too broad, needs angle)

OUTPUT FORMAT:
Return a JSON object with a "topics" array containing exactly 3 topics:
{
  "topics": [
    {
      "id": "unique-id-1",
      "title": "Short engaging title",
      "description": "One sentence hook that makes them want to explore this",
      "difficulty": "accessible" | "moderate" | "challenging",
      "cognitive_focus": ["explanatory", "argumentation"] // 1-3 skills from: explanatory, argumentation, hypothetical, epistemic, metacognition, synthesis, question_asking, transfer, affective
    }
  ]
}`;
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

