/**
 * Session Types
 * 
 * Types for the voice session system including:
 * - Tutorial phases
 * - Skill observations
 * - Open loops
 * - Visuals
 * - Lesson plan modifications
 * - Transcript entries
 */

import type { SkillDimensionName } from './database-helpers';

// Tutorial phases following the Oxford-style structure
export type TutorialPhase =
  | 'warm_entry'    // 2-4 min: Greet, offer topics, gauge prior knowledge
  | 'diagnostic'    // 3-5 min: Open questions to assess level
  | 'scaffolding'   // 10-15 min: Build understanding with checks
  | 'deepening'     // 5-10 min: Challenge with harder problems
  | 'transfer'      // 3-5 min: Connect to other domains/life
  | 'reflection';   // 3-5 min: Synthesize and close

// Session status for UI state management
export type SessionStatus =
  | 'idle'          // Not started
  | 'connecting'    // Establishing WebRTC connection
  | 'connected'     // Active session
  | 'paused'        // User paused
  | 'ending'        // Saving session data
  | 'error';        // Connection or session error

// Transcript entry
export interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

// Skill observation logged by AI during session
export interface SkillObservation {
  skill: SkillDimensionName;
  observation: string;
  evidence?: string;
  strength_or_struggle: 'strength' | 'struggle' | 'neutral';
  timestamp: number;
}

// Open loop - curiosity to follow up on later
export interface SessionOpenLoop {
  topic: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

// Visual displayed to user during session
export interface SessionVisual {
  type: 'diagram' | 'image' | 'whiteboard' | 'chart';
  description: string;
  content?: string;
  timestamp: number;
}

// Lesson plan modification made by AI
export interface LessonPlanModification {
  modification: string;
  rationale: string;
  timestamp: number;
}

// Misconception flagged during session
export interface SessionMisconception {
  misconception: string;
  topic_area: string;
  addressed: boolean;
  timestamp: number;
}

// Topic generated for session
export interface GeneratedTopic {
  id: string;
  title: string;
  description: string;
  difficulty: 'accessible' | 'moderate' | 'challenging';
  cognitive_focus: SkillDimensionName[];
}

// Topic option as presented by AI (for visual display)
export interface PresentedTopic {
  optionNumber: 1 | 2 | 3;
  title: string;
  description: string;
  isSelected: boolean;
  timestamp: number;
}

// Lesson plan generated after topic selection
export interface LessonPlan {
  topic: string;
  diagnosticQuestions: {
    opening: string;
    followUps: string[];
    misconceptionsToWatch: string[];
  };
  keyConcepts: Array<{
    name: string;
    explanation: string;
    buildFrom?: string;
  }>;
  scaffoldingStrategies: {
    forStrong: string[];
    forStruggling: string[];
  };
  challengeQuestion: {
    question: string;
    strongResponsePattern: string;
    strugglingResponsePattern: string;
    scaffoldingIfStruggling: string;
  };
  transferConnections: {
    domains: string[];
    promptQuestion: string;
  };
  reflectionPrompts: string[];
  timeAllocation: {
    diagnostic: number;
    scaffolding: number;
    deepening: number;
    transfer: number;
    reflection: number;
  };
}

// Complete session state for orchestration
export interface SessionState {
  status: SessionStatus;
  phase: TutorialPhase;
  elapsedSeconds: number;
  transcript: TranscriptEntry[];
  skillObservations: SkillObservation[];
  openLoops: SessionOpenLoop[];
  visuals: SessionVisual[];
  lessonPlanMods: LessonPlanModification[];
  misconceptions: SessionMisconception[];
  topicChosen?: GeneratedTopic;
  topicOptions?: GeneratedTopic[];
  sessionId: string | null;
}

// Function call from AI (parsed from response.done)
export interface FunctionCall {
  name: string;
  call_id: string;
  arguments: string; // JSON string
}

// WebRTC connection refs
export interface WebRTCRefs {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  localStream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
}

// Realtime API event types we care about
export type RealtimeEventType =
  | 'session.created'
  | 'session.updated'
  | 'response.done'
  | 'response.output_audio_transcript.delta'
  | 'conversation.item.added'
  | 'conversation.item.done'
  | 'input_audio_buffer.speech_started'
  | 'input_audio_buffer.speech_stopped'
  | 'error';

// Session end payload sent to backend
export interface SessionEndPayload {
  sessionId: string;
  transcript: TranscriptEntry[];
  skillObservations: SkillObservation[];
  openLoops: SessionOpenLoop[];
  lessonPlanMods: LessonPlanModification[];
  misconceptions: SessionMisconception[];
  duration: number;
  topicChosen?: GeneratedTopic;
  phase: TutorialPhase;
}

