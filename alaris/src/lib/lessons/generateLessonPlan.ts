/**
 * Lesson Plan Generation
 * 
 * Generates detailed, pedagogically-grounded lesson plans using Gemini 3.
 * Called when a user selects a topic.
 * 
 * The lesson plan provides STRUCTURE to guide the gpt-realtime model,
 * compensating for its conversational default mode with substantive scaffolding.
 */

import type { LessonPlan } from '@/types/session';

// Enhanced JSON Schema for lesson plan output
const LESSON_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    
    // Core factual content requirements
    coreFacts: {
      type: 'object',
      properties: {
        definitions: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Technical terms that MUST be defined during the tutorial'
        },
        theories: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Key frameworks/theories to introduce by name'
        },
        evidence: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Specific studies, experiments, or data to mention'
        }
      },
      required: ['definitions', 'theories', 'evidence']
    },
    
    // Diagnostic phase
    diagnosticQuestions: {
      type: 'object',
      properties: {
        opening: { type: 'string' },
        followUps: { type: 'array', items: { type: 'string' } },
        misconceptionsToWatch: { type: 'array', items: { type: 'string' } }
      },
      required: ['opening', 'followUps', 'misconceptionsToWatch']
    },
    
    // Key concepts with depth progression
    keyConcepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          explanation: { type: 'string' },
          buildFrom: { type: 'string' },
          checkQuestion: { 
            type: 'string',
            description: 'Question to verify understanding before moving on'
          },
          depthTarget: {
            type: 'string',
            enum: ['surface', 'working', 'teaching'],
            description: 'How deep they need to understand this concept'
          }
        },
        required: ['name', 'explanation', 'checkQuestion', 'depthTarget']
      }
    },
    
    // Question bank by type and difficulty
    questionBank: {
      type: 'object',
      properties: {
        simple: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Accessible entry questions anyone can engage with'
        },
        probing: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Follow-up questions that push for mechanism/evidence'
        },
        challenging: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Harder questions for when they are flying'
        },
        transfer: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Questions connecting to other domains/life'
        }
      },
      required: ['simple', 'probing', 'challenging', 'transfer']
    },
    
    // Scaffolding strategies
    scaffoldingStrategies: {
      type: 'object',
      properties: {
        forStrong: { type: 'array', items: { type: 'string' } },
        forStruggling: { type: 'array', items: { type: 'string' } }
      },
      required: ['forStrong', 'forStruggling']
    },
    
    // Challenge question
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
    
    // Visual moments
    visualTriggers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          when: { type: 'string' },
          type: { type: 'string', enum: ['diagram', 'chart', 'concept_map', 'timeline', 'comparison'] },
          description: { type: 'string' }
        },
        required: ['when', 'type', 'description']
      }
    },
    
    // Transfer connections
    transferConnections: {
      type: 'object',
      properties: {
        domains: { type: 'array', items: { type: 'string' } },
        promptQuestion: { type: 'string' }
      },
      required: ['domains', 'promptQuestion']
    },
    
    // Reflection prompts
    reflectionPrompts: { type: 'array', items: { type: 'string' } },
    
    // Time allocation
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
  required: ['topic', 'coreFacts', 'diagnosticQuestions', 'keyConcepts', 'questionBank', 'scaffoldingStrategies', 'challengeQuestion', 'visualTriggers', 'transferConnections', 'reflectionPrompts', 'timeAllocation']
};

interface LessonPlanContext {
  topicTitle: string;
  userPriorKnowledge: string;
  userAge?: number;
  userLocation?: string;
  sessionCount?: number;
  previousLearningPatterns?: string;
}

/**
 * Generate a detailed lesson plan for the selected topic using Gemini 3
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
              thinkingLevel: 'low'
            },
            responseMimeType: 'application/json',
            responseJsonSchema: LESSON_PLAN_SCHEMA
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Lesson plan generation failed:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('No content in Gemini response');
      return null;
    }

    return JSON.parse(content) as LessonPlan;

  } catch (error) {
    console.error('Lesson plan generation error:', error);
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
Generate a detailed lesson plan. Be SPECIFIC and CONCRETE - not generic.

## CORE FACTS (What factual content MUST be covered)
- definitions: Technical terms that MUST be defined (3-5 terms)
- theories: Key frameworks/theories to introduce by NAME (2-3)
- evidence: Specific studies, experiments, historical examples to mention (2-3)

## DIAGNOSTIC QUESTIONS (3-5 minutes)
- Opening question: Open-ended, accessible to anyone. Start simple: "What comes to mind when...?" or "Have you ever noticed...?"
- Follow-up probes: 3-4 questions based on likely responses
- Misconceptions to watch for: Common incorrect beliefs

## KEY CONCEPTS (ordered by complexity, 5-7 concepts)
Each concept needs:
- Name and one-sentence explanation
- What it builds from (if applicable)
- Check question: How to verify they understand before moving on
- Depth target: How deep they need to go (surface/working/teaching)

NOTE: Don't require them to re-explain EVERY concept. Check understanding 2-3 times during the tutorial for key concepts. If it's clear they got it, move on.

## QUESTION BANK (20+ total questions across types)
Questions should be WELL-FRAMED, not jargon-heavy. Start simple, then develop.

### Simple (entry-level, anyone can engage):
Good examples:
- "Are memories ever reliable?" (not "Describe the reliability of episodic memory")
- "Are there different types of memory?" (not "Distinguish semantic from episodic memory")
- "Why do we forget things?"
- "Have you ever misremembered something?"

### Probing (push for mechanism/evidence when appropriate):
Good examples:
- "HOW does that happen? What's the process?"
- "What would need to be true for that to work?"
- "Can you think of an example?"
- "What's the difference between X and Y in this case?"

### Challenging (for when they're flying):
- More nuanced trade-offs
- Edge cases and exceptions
- Connecting multiple concepts
- Counterarguments and limitations

### Transfer (connecting to life/other domains):
- Personal experience questions
- Modern parallels
- Cross-domain applications

## SCAFFOLDING STRATEGIES
### For STRONG responses (articulate, makes connections):
- Specific ways to push deeper
- Advanced questions to introduce
- Nuances to explore

### For STRUGGLING responses (vague, confused, silent):
- Specific analogies to use (give the actual analogy)
- Simpler entry points
- Story mode approaches

## CHALLENGE QUESTION
One meaty question requiring synthesis. Include:
- The question itself
- What a STRONG response looks like (with example)
- What a STRUGGLING response looks like (with example)
- How to scaffold if they struggle

## VISUAL TRIGGERS
Specify 2-3 moments where a visual would help:
- when: "When explaining the three-stage model"
- type: diagram/chart/concept_map/timeline/comparison
- description: What the visual should show

## TRANSFER CONNECTIONS
- 2-3 domains to connect to
- A specific question to prompt transfer

## REFLECTION PROMPTS
3-4 specific wrap-up questions:
- Summary prompt
- Surprise/insight prompt
- Future curiosity prompt

## TIME ALLOCATION (total ~30 minutes)

# QUALITY GUIDELINES

POOR lesson planning (too generic):
"Ask them what they know, then explain the concept, then ask questions."

GOOD lesson planning (specific and actionable):
"Opening: 'When you think of [topic], what comes to mind? Any images, experiences, or questions?'
If they say 'I don't know anything': 'That's totally fine! Let's start with something familiar. Have you ever [relatable example]?'
If they give a common misconception: 'Interesting! Many people think that. What makes you say that? Let's explore whether it holds up...'"

REMEMBER:
- Questions should start SIMPLE and ACCESSIBLE
- Don't front-load jargon - introduce terms when needed
- An Oxford tutor asks "Are memories ever reliable?" and then DEVELOPS from there
- Provide STRUCTURE so the voice AI has substantive scaffolding to follow`;
}

/**
 * Format lesson plan for injection into session.update
 */
export function formatLessonPlanForPrompt(plan: LessonPlan | null): string {
  // Handle null or malformed plan gracefully
  if (!plan || !plan.topic) {
    return `
# LESSON PLAN
No structured lesson plan was generated. Proceed with your Oxford-style Socratic approach:
1. Start with an open diagnostic question to gauge understanding
2. Build concepts from simple to complex
3. Use scaffolding based on their responses
4. End with reflection`;
  }

  // Safe accessors with fallbacks
  const definitions = plan.coreFacts?.definitions || [];
  const theories = plan.coreFacts?.theories || [];
  const evidence = plan.coreFacts?.evidence || [];
  const diagnosticOpening = plan.diagnosticQuestions?.opening || 'What do you already know about this topic?';
  const followUps = plan.diagnosticQuestions?.followUps || [];
  const misconceptions = plan.diagnosticQuestions?.misconceptionsToWatch || [];
  const keyConcepts = plan.keyConcepts || [];
  const questionBank = plan.questionBank || { simple: [], probing: [], challenging: [], transfer: [] };
  const forStrong = plan.scaffoldingStrategies?.forStrong || ['Push deeper with nuanced questions'];
  const forStruggling = plan.scaffoldingStrategies?.forStruggling || ['Break down into simpler parts'];
  const challengeQuestion = plan.challengeQuestion?.question || 'How would you explain this to someone else?';
  const strongPattern = plan.challengeQuestion?.strongResponsePattern || 'Makes connections and synthesizes';
  const strugglingPattern = plan.challengeQuestion?.strugglingResponsePattern || 'Gives vague or incomplete answer';
  const scaffoldIfStruggling = plan.challengeQuestion?.scaffoldingIfStruggling || 'Break into smaller parts';
  const visualTriggers = plan.visualTriggers || [];
  const domains = plan.transferConnections?.domains || [];
  const transferPrompt = plan.transferConnections?.promptQuestion || 'How does this connect to your own life?';
  const reflectionPrompts = plan.reflectionPrompts || ['What surprised you?', 'What do you want to explore next?'];
  const timeAlloc = plan.timeAllocation || { diagnostic: 5, scaffolding: 10, deepening: 8, transfer: 4, reflection: 3 };

  return `
# LESSON PLAN FOR: ${plan.topic}

## CORE FACTS TO COVER
Definitions to introduce: ${definitions.join(', ') || 'None specified'}
Theories/frameworks: ${theories.join(', ') || 'None specified'}
Evidence to mention: ${evidence.join(', ') || 'None specified'}

## DIAGNOSTIC PHASE (${timeAlloc.diagnostic} min)
Opening Question: "${diagnosticOpening}"
${followUps.length > 0 ? `Follow-ups: ${followUps.map(q => `"${q}"`).join(', ')}` : ''}
${misconceptions.length > 0 ? `Watch for misconceptions: ${misconceptions.join('; ')}` : ''}

## KEY CONCEPTS (in order of complexity)
${keyConcepts.length > 0 
  ? keyConcepts.map((c, i) => 
      `${i + 1}. ${c.name}: ${c.explanation}${c.buildFrom ? ` (builds from: ${c.buildFrom})` : ''}
   - Check understanding with: "${c.checkQuestion || 'Can you explain that back to me?'}"
   - Depth needed: ${c.depthTarget || 'working'}`
    ).join('\n\n')
  : 'Build concepts organically based on their responses.'}

## QUESTION BANK
### Simple (start here):
${questionBank.simple?.map(q => `- "${q}"`).join('\n') || '- "What do you know about this?"'}

### Probing (when you need to go deeper):
${questionBank.probing?.map(q => `- "${q}"`).join('\n') || '- "Can you say more about that?"'}

### Challenging (when they are flying):
${questionBank.challenging?.map(q => `- "${q}"`).join('\n') || '- "What would be the counterargument?"'}

### Transfer (connecting to life):
${questionBank.transfer?.map(q => `- "${q}"`).join('\n') || '- "Where else might this apply?"'}

## SCAFFOLDING
If they're STRONG (articulate, connecting ideas):
${forStrong.map(s => `- ${s}`).join('\n')}

If they're STRUGGLING (confused, vague, silent):
${forStruggling.map(s => `- ${s}`).join('\n')}

## CHALLENGE QUESTION (${timeAlloc.deepening} min)
"${challengeQuestion}"
- Strong response: ${strongPattern}
- Struggling response: ${strugglingPattern}
- If struggling, scaffold: ${scaffoldIfStruggling}

## VISUAL MOMENTS
${visualTriggers.length > 0 
  ? visualTriggers.map(v => `- When: ${v.when} → Show: ${v.type} (${v.description})`).join('\n')
  : 'Consider a visual when explaining processes or relationships'}

## TRANSFER (${timeAlloc.transfer} min)
${domains.length > 0 ? `Connect to: ${domains.join(', ')}` : 'Connect to their daily life'}
Prompt: "${transferPrompt}"

## REFLECTION (${timeAlloc.reflection} min)
${reflectionPrompts.map(p => `- "${p}"`).join('\n')}

## TIME BUDGET (Total: ${Object.values(timeAlloc).reduce((a, b) => a + b, 0)} min)
- Diagnostic: ${timeAlloc.diagnostic}min
- Scaffolding: ${timeAlloc.scaffolding}min  
- Deepening: ${timeAlloc.deepening}min
- Transfer: ${timeAlloc.transfer}min
- Reflection: ${timeAlloc.reflection}min

FOLLOW THIS PLAN while staying responsive. Use the question bank. Adapt as needed but ensure you cover the core facts and key concepts.`;
}
