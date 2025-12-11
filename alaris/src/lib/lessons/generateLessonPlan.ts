/**
 * Lesson Plan Generation
 * 
 * Generates detailed, pedagogically-grounded lesson plans using GPT-5.1-mini.
 * Called when a user selects a topic.
 */

import type { LessonPlan } from '@/types/session';

// JSON Schema for the lesson plan output
const LESSON_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    diagnosticQuestions: {
      type: 'object',
      properties: {
        opening: { type: 'string' },
        followUps: { type: 'array', items: { type: 'string' } },
        misconceptionsToWatch: { type: 'array', items: { type: 'string' } }
      },
      required: ['opening', 'followUps', 'misconceptionsToWatch']
    },
    keyConcepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          explanation: { type: 'string' },
          buildFrom: { type: 'string' }
        },
        required: ['name', 'explanation']
      }
    },
    scaffoldingStrategies: {
      type: 'object',
      properties: {
        forStrong: { type: 'array', items: { type: 'string' } },
        forStruggling: { type: 'array', items: { type: 'string' } }
      },
      required: ['forStrong', 'forStruggling']
    },
    challengeQuestion: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        strongResponsePattern: { type: 'string' },
        strugglingResponsePattern: { type: 'string' },
        scaffoldingIfStruggling: { type: 'string' }
      },
      required: ['question', 'strongResponsePattern', 'strugglingResponsePattern', 'scaffoldingIfStruggling']
    },
    transferConnections: {
      type: 'object',
      properties: {
        domains: { type: 'array', items: { type: 'string' } },
        promptQuestion: { type: 'string' }
      },
      required: ['domains', 'promptQuestion']
    },
    reflectionPrompts: { type: 'array', items: { type: 'string' } },
    timeAllocation: {
      type: 'object',
      properties: {
        diagnostic: { type: 'number' },
        scaffolding: { type: 'number' },
        deepening: { type: 'number' },
        transfer: { type: 'number' },
        reflection: { type: 'number' }
      },
      required: ['diagnostic', 'scaffolding', 'deepening', 'transfer', 'reflection']
    }
  },
  required: ['topic', 'diagnosticQuestions', 'keyConcepts', 'scaffoldingStrategies', 'challengeQuestion', 'transferConnections', 'reflectionPrompts', 'timeAllocation']
};

interface LessonPlanContext {
  topicTitle: string;
  userPriorKnowledge: string;
  userAge?: number;
  userLocation?: string;
  sessionCount?: number;
  previousLearningPatterns?: string; // Placeholder for future
}

/**
 * Generate a detailed lesson plan for the selected topic
 */
export async function generateLessonPlan(context: LessonPlanContext): Promise<LessonPlan | null> {
  const {
    topicTitle,
    userPriorKnowledge,
    userAge,
    userLocation,
    sessionCount = 0,
    previousLearningPatterns = 'No previous learning patterns available yet.'
  } = context;

  const prompt = buildLessonPlanPrompt(
    topicTitle,
    userPriorKnowledge,
    userAge,
    userLocation,
    sessionCount,
    previousLearningPatterns
  );

  try {
    // Use GPT-5.1-mini via Responses API for speed
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Fallback if gpt-5.1-mini not available
        input: prompt,
        reasoning: { effort: 'low' },
        text: { format: { type: 'json_schema', json_schema: { name: 'lesson_plan', schema: LESSON_PLAN_SCHEMA } } }
      }),
    });

    if (!response.ok) {
      // Fallback to Chat Completions if Responses API not available
      return await generateLessonPlanFallback(prompt);
    }

    const data = await response.json();
    return JSON.parse(data.output_text) as LessonPlan;

  } catch (error) {
    console.error('Lesson plan generation error:', error);
    return await generateLessonPlanFallback(prompt);
  }
}

/**
 * Fallback to Chat Completions API
 */
async function generateLessonPlanFallback(prompt: string): Promise<LessonPlan | null> {
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Fallback lesson plan generation failed');
      return null;
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as LessonPlan;

  } catch (error) {
    console.error('Fallback lesson plan error:', error);
    return null;
  }
}

/**
 * Build the detailed lesson plan prompt
 */
function buildLessonPlanPrompt(
  topicTitle: string,
  userPriorKnowledge: string,
  userAge?: number,
  userLocation?: string,
  sessionCount?: number,
  previousLearningPatterns?: string
): string {
  const ageContext = userAge 
    ? `User Age: ${userAge} years old${userAge < 16 ? ' (younger learner - use accessible language, more narrative-driven)' : userAge < 19 ? ' (older teen - can handle complexity)' : ' (adult learner)'}`
    : 'User Age: Unknown';
    
  const locationContext = userLocation 
    ? `Location: ${userLocation} (consider local examples and cultural context)`
    : 'Location: Unknown';

  const experienceContext = sessionCount !== undefined
    ? `Session Count: ${sessionCount} (${sessionCount < 3 ? 'NEW USER - prioritize engagement and confidence-building' : 'returning user - can push harder'})`
    : 'Session Count: Unknown';

  return `You are an expert educational designer creating a detailed lesson plan for an Oxford-style Socratic tutorial.

# LEARNER CONTEXT
${ageContext}
${locationContext}
${experienceContext}
Previous Learning Patterns: ${previousLearningPatterns}
User's Stated Prior Knowledge: "${userPriorKnowledge}"

# TOPIC
"${topicTitle}"

# PEDAGOGICAL FRAMEWORK
This is NOT a lecture plan. This is a Socratic dialogue plan. The goal is to:
1. Train COGNITIVE SKILLS through questioning, not just transfer knowledge
2. Build the learner's confidence and enjoyment of thinking
3. Adapt in real-time to their responses
4. Create "productive struggle" - challenge without frustration

# YOUR TASK
Generate a detailed lesson plan with the following structure. Be SPECIFIC and CONCRETE - not generic.

## DIAGNOSTIC QUESTIONS (3-5 minutes)
- Opening question: The first question you'll ask to gauge their understanding. Should be open-ended.
- Follow-up probes: 3-4 follow-up questions based on likely responses
- Misconceptions to watch for: Common incorrect beliefs about this topic

## KEY CONCEPTS (ordered by complexity)
List 4-6 key concepts that should be covered, each with:
- Name of the concept
- One-sentence explanation
- What prior knowledge it builds from (if applicable)

ORDER these from simplest/most accessible to most complex. Start from where the user is.

## SCAFFOLDING STRATEGIES
Provide specific strategies for TWO scenarios:

### For STRONG responses (articulate, makes connections):
- How to push them deeper
- Advanced questions to ask
- Nuances to introduce

### For STRUGGLING responses (vague, confused, silent):
- How to break it down
- Analogies to use
- Simpler entry points

Be SPECIFIC. Don't just say "use analogies" - give the actual analogy.

## CHALLENGE QUESTION
One meaty question that requires synthesis and deeper thinking. Include:
- The question itself
- What a STRONG response looks like (with example)
- What a STRUGGLING response looks like (with example)
- How to scaffold if they struggle

## TRANSFER CONNECTIONS
- 2-3 domains/contexts to connect this topic to (modern life, other fields, their personal experience)
- A specific question to prompt transfer thinking

## REFLECTION PROMPTS
3-4 specific questions for the end-of-session reflection:
- Summary prompt
- Surprise/insight prompt
- Future curiosity prompt
- Self-assessment prompt

## TIME ALLOCATION (in minutes, total ~30)
- diagnostic: X
- scaffolding: X
- deepening: X
- transfer: X
- reflection: X

# EXAMPLES OF GOOD VS POOR PLANNING

POOR (too generic):
"Ask them what they know, then explain the concept, then ask questions."

GOOD (specific and actionable):
"Opening: 'When you hear the word [topic], what comes to mind? Any images, feelings, or questions?'
If they say 'I don't know anything': 'That's totally fine! Let's start with something familiar. Have you ever [relatable example]?'
If they give a common misconception: 'Interesting! Many people think that. What makes you say [X]? Let's explore whether that holds up...'"

# OUTPUT FORMAT
Return a JSON object matching this exact structure. Be specific and detailed in every field.`;
}

/**
 * Format lesson plan for injection into session.update
 */
export function formatLessonPlanForPrompt(plan: LessonPlan): string {
  return `
# LESSON PLAN FOR: ${plan.topic}

## DIAGNOSTIC PHASE
Opening Question: "${plan.diagnosticQuestions.opening}"
Follow-ups to probe: ${plan.diagnosticQuestions.followUps.map(q => `"${q}"`).join(', ')}
Watch for misconceptions: ${plan.diagnosticQuestions.misconceptionsToWatch.join(', ')}

## KEY CONCEPTS (in order)
${plan.keyConcepts.map((c, i) => `${i + 1}. ${c.name}: ${c.explanation}${c.buildFrom ? ` (builds from: ${c.buildFrom})` : ''}`).join('\n')}

## SCAFFOLDING STRATEGIES
If they're STRONG (articulate, connecting ideas):
${plan.scaffoldingStrategies.forStrong.map(s => `- ${s}`).join('\n')}

If they're STRUGGLING (confused, silent, vague):
${plan.scaffoldingStrategies.forStruggling.map(s => `- ${s}`).join('\n')}

## CHALLENGE QUESTION
"${plan.challengeQuestion.question}"
- Strong response looks like: ${plan.challengeQuestion.strongResponsePattern}
- Struggling response looks like: ${plan.challengeQuestion.strugglingResponsePattern}
- If struggling, scaffold: ${plan.challengeQuestion.scaffoldingIfStruggling}

## TRANSFER
Connect to: ${plan.transferConnections.domains.join(', ')}
Prompt: "${plan.transferConnections.promptQuestion}"

## REFLECTION
${plan.reflectionPrompts.map(p => `- "${p}"`).join('\n')}

## TIME BUDGET
- Diagnostic: ${plan.timeAllocation.diagnostic}min
- Scaffolding: ${plan.timeAllocation.scaffolding}min  
- Deepening: ${plan.timeAllocation.deepening}min
- Transfer: ${plan.timeAllocation.transfer}min
- Reflection: ${plan.timeAllocation.reflection}min

FOLLOW THIS PLAN while staying responsive to the learner. Adapt as needed but use these specific questions and strategies.`;
}

