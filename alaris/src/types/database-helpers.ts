/**
 * Database Helper Types
 * 
 * These provide cleaner interfaces for working with database records
 * and define the structure of JSON fields.
 */

import type { Database, SessionStatus, FlagSeverity, FlagType } from './database';

// Re-export enums
export type { SessionStatus, FlagSeverity, FlagType };

// Table row types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type Memory = Database['public']['Tables']['memories']['Row'];
export type MemoryInsert = Database['public']['Tables']['memories']['Insert'];
export type MemoryUpdate = Database['public']['Tables']['memories']['Update'];

export type ModerationLog = Database['public']['Tables']['moderation_logs']['Row'];
export type ModerationLogInsert = Database['public']['Tables']['moderation_logs']['Insert'];
export type ModerationLogUpdate = Database['public']['Tables']['moderation_logs']['Update'];

// Age brackets
export type AgeBracket = '13-15' | '16-18' | '19-25' | '26+' | 'unknown';

// Topic mastery levels
export type MasteryLevel = 'unknown' | 'fragile' | 'usable' | 'robust';

// Skill trend
export type SkillTrend = 'improving' | 'stable' | 'declining';

// Known topic structure
export interface KnownTopic {
  name: string;
  level: MasteryLevel;
  last_discussed?: string; // ISO date
}

// Skill dimension structure (9 dimensions)
export interface SkillDimension {
  name: SkillDimensionName;
  level: number; // 1-10 scale
  notes: string;
  trend: SkillTrend;
}

export type SkillDimensionName = 
  | 'explanatory'      // Can they explain back? Build mental models?
  | 'argumentation'    // Reasons vs opinions? See counterarguments?
  | 'hypothetical'     // Engage with "what if"?
  | 'epistemic'        // Calibrated confidence? Know what they don't know?
  | 'metacognition'    // Aware of their thinking process?
  | 'synthesis'        // Compress learnings?
  | 'question_asking'  // Sharpen vague curiosity?
  | 'transfer'         // Connect to life/other domains?
  | 'affective';       // Enjoy thinking? Resilient to difficulty?

// Cognitive style
export interface CognitiveStyle {
  approach: 'analytical' | 'intuitive' | 'balanced' | 'unknown';
  verbosity: 'concise' | 'moderate' | 'verbose' | 'unknown';
  pacing_preference?: 'slow' | 'moderate' | 'fast';
}

// Open loop (curiosity thread to follow up on)
export interface OpenLoop {
  content: string;
  created_at: string; // ISO date
  topic?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Misconception record
export interface Misconception {
  topic: string;
  misconception: string;
  corrected?: boolean;
  session_id?: string;
}

// Full learner profile structure (stored in memories.profile_json)
export interface LearnerProfile {
  interest_tags: string[];
  known_topics: KnownTopic[];
  skill_dimensions: SkillDimension[];
  cognitive_style: CognitiveStyle;
  open_loops: OpenLoop[];
  misconceptions_flagged: Misconception[];
  recent_topics: string[]; // Last 10 topics discussed
}

// Default learner profile for new users
export const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  interest_tags: [],
  known_topics: [],
  skill_dimensions: [
    { name: 'explanatory', level: 5, notes: '', trend: 'stable' },
    { name: 'argumentation', level: 5, notes: '', trend: 'stable' },
    { name: 'hypothetical', level: 5, notes: '', trend: 'stable' },
    { name: 'epistemic', level: 5, notes: '', trend: 'stable' },
    { name: 'metacognition', level: 5, notes: '', trend: 'stable' },
    { name: 'synthesis', level: 5, notes: '', trend: 'stable' },
    { name: 'question_asking', level: 5, notes: '', trend: 'stable' },
    { name: 'transfer', level: 5, notes: '', trend: 'stable' },
    { name: 'affective', level: 5, notes: '', trend: 'stable' },
  ],
  cognitive_style: { approach: 'unknown', verbosity: 'unknown' },
  open_loops: [],
  misconceptions_flagged: [],
  recent_topics: [],
};

// Session summary structure (stored in sessions.summary)
export interface SessionSummary {
  topic: string;
  main_ideas_covered: string[];
  user_strengths: string[];
  user_struggles: string[];
  open_loops_created: OpenLoop[];
  skill_observations: Partial<Record<SkillDimensionName, {
    observed_level: number;
    notes: string;
  }>>;
  recommended_next_topics: string[];
  overall_assessment: string;
}

// Topic option (offered at session start)
export interface TopicOption {
  id: string;
  title: string;
  description: string;
  difficulty_estimate: 'accessible' | 'moderate' | 'challenging';
  cognitive_focus: SkillDimensionName[];
}

// User with memory combined (from get_user_with_memory function)
export interface UserWithMemory {
  user_id: string;
  full_name: string;
  email: string;
  age_bracket: AgeBracket;
  session_count: number;
  is_admin: boolean;
  profile: LearnerProfile;
}

// Auth signup data
export interface SignupData {
  full_name: string;
  email: string;
  password: string;
  date_of_birth: string; // YYYY-MM-DD
  location?: string;
}

// Auth login data
export interface LoginData {
  email: string;
  password: string;
}
