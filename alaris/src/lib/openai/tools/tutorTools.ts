/**
 * Tutor Tools for Function Calling
 * 
 * These tools allow the AI tutor to:
 * - Track tutorial phase transitions
 * - Log skill observations
 * - Create open loops for future sessions
 * - Display visuals to the user
 * - Update lesson plans dynamically
 * - Flag misconceptions
 */

// Tool definition type matching OpenAI Realtime API format
export interface RealtimeTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * Get all tutor tools for the session
 */
export function getTutorTools(): RealtimeTool[] {
  return [
    {
      type: 'function',
      name: 'transition_phase',
      description: 'Internally mark when you are transitioning to a different tutorial phase. Do not announce this to the user - just call this silently when you naturally shift approach.',
      parameters: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['warm_entry', 'diagnostic', 'scaffolding', 'deepening', 'transfer', 'reflection'],
            description: 'The phase you are transitioning to'
          },
          rationale: {
            type: 'string',
            description: 'Brief note on why you are transitioning now (for logging)'
          }
        },
        required: ['phase']
      }
    },
    {
      type: 'function',
      name: 'log_skill_observation',
      description: 'Silently log an observation about the learner\'s cognitive skill demonstration. Call this whenever you notice something notable about their thinking - strengths or struggles. Do not announce to the user.',
      parameters: {
        type: 'object',
        properties: {
          skill: {
            type: 'string',
            enum: ['explanatory', 'argumentation', 'hypothetical', 'epistemic', 'metacognition', 'synthesis', 'question_asking', 'transfer', 'affective'],
            description: 'Which of the 9 cognitive skills this observation is about'
          },
          observation: {
            type: 'string',
            description: 'What you noticed about their skill (e.g., "Struggled to articulate causation" or "Excellent counterargument")'
          },
          evidence: {
            type: 'string',
            description: 'Brief quote or paraphrase from what they said as evidence'
          },
          strength_or_struggle: {
            type: 'string',
            enum: ['strength', 'struggle', 'neutral'],
            description: 'Whether this was a strength, struggle, or neutral observation'
          }
        },
        required: ['skill', 'observation', 'strength_or_struggle']
      }
    },
    {
      type: 'function',
      name: 'create_open_loop',
      description: 'Record something the user expressed curiosity about for future sessions. Call this when they ask about something you won\'t fully cover, or express interest in a tangent.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or question they want to explore'
          },
          context: {
            type: 'string',
            description: 'How it came up in conversation'
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'How excited they seemed about this (high = very eager, low = passing mention)'
          }
        },
        required: ['topic', 'context', 'priority']
      }
    },
    {
      type: 'function',
      name: 'display_visual',
      description: 'Show a visual to the user (diagram, image, chart). IMPORTANT: Always give verbal context before calling this - say something like "Let me show you..." first.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['diagram', 'image', 'whiteboard', 'chart'],
            description: 'Type of visual to display'
          },
          description: {
            type: 'string',
            description: 'What the visual shows - be specific enough that it could be generated or found (e.g., "Feudal hierarchy pyramid showing King > Lords > Knights > Peasants")'
          }
        },
        required: ['type', 'description']
      }
    },
    {
      type: 'function',
      name: 'update_lesson_plan',
      description: 'Note when you are significantly changing your approach or plan for this session. Call this when adapting based on how the learner is doing.',
      parameters: {
        type: 'object',
        properties: {
          modification: {
            type: 'string',
            description: 'What you are changing (e.g., "Extending scaffolding phase, reducing deepening time" or "Adding story mode to increase engagement")'
          },
          rationale: {
            type: 'string',
            description: 'Why you made this change based on the learner\'s responses'
          }
        },
        required: ['modification', 'rationale']
      }
    },
    {
      type: 'function',
      name: 'flag_misconception',
      description: 'Record a misconception the user holds. Call this when you detect an incorrect belief or understanding that should be addressed.',
      parameters: {
        type: 'object',
        properties: {
          misconception: {
            type: 'string',
            description: 'The incorrect belief or understanding they have'
          },
          topic_area: {
            type: 'string',
            description: 'What topic this misconception relates to'
          },
          addressed: {
            type: 'string',
            enum: ['true', 'false'],
            description: 'Whether you have addressed/corrected it in this session'
          }
        },
        required: ['misconception', 'topic_area', 'addressed']
      }
    }
  ];
}

/**
 * Format tools for session.update event
 */
export function formatToolsForSession(): object[] {
  return getTutorTools().map(tool => ({
    type: tool.type,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

