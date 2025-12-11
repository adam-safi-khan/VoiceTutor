/**
 * Database Types for Supabase
 * 
 * These types match the schema defined in supabase/migrations/
 * After running migrations, you can regenerate with:
 * npx supabase gen types typescript --linked > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types matching PostgreSQL enums
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'error';
export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FlagType = 
  | 'inappropriate_content'
  | 'safety_concern'
  | 'age_inappropriate'
  | 'technical_issue'
  | 'user_distress'
  | 'policy_violation'
  | 'other';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          date_of_birth: string // DATE stored as ISO string
          location: string | null
          age_bracket: string // Generated column: '13-15' | '16-18' | '19-25' | '26+' | 'unknown'
          session_count: number
          sessions_today: number
          last_session_date: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string // Must match auth.users id
          full_name: string
          email: string
          date_of_birth: string
          location?: string | null
          session_count?: number
          sessions_today?: number
          last_session_date?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          date_of_birth?: string
          location?: string | null
          session_count?: number
          sessions_today?: number
          last_session_date?: string | null
          is_admin?: boolean
          updated_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          user_id: string
          profile_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_json?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_json?: Json
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          topic_chosen: string | null
          topic_options: Json | null
          transcript: string | null
          summary: Json | null
          engagement_score: number | null
          user_talk_time_seconds: number
          ai_talk_time_seconds: number
          interruption_count: number
          questions_asked: number
          status: SessionStatus
          resume_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          topic_chosen?: string | null
          topic_options?: Json | null
          transcript?: string | null
          summary?: Json | null
          engagement_score?: number | null
          user_talk_time_seconds?: number
          ai_talk_time_seconds?: number
          interruption_count?: number
          questions_asked?: number
          status?: SessionStatus
          resume_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          ended_at?: string | null
          duration_minutes?: number | null
          topic_chosen?: string | null
          topic_options?: Json | null
          transcript?: string | null
          summary?: Json | null
          engagement_score?: number | null
          user_talk_time_seconds?: number
          ai_talk_time_seconds?: number
          interruption_count?: number
          questions_asked?: number
          status?: SessionStatus
          resume_token?: string | null
          updated_at?: string
        }
      }
      moderation_logs: {
        Row: {
          id: string
          session_id: string | null
          user_id: string
          flag_type: FlagType
          severity: FlagSeverity
          description: string | null
          transcript_excerpt: string | null
          ai_response_excerpt: string | null
          reviewed: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          action_taken: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id: string
          flag_type: FlagType
          severity?: FlagSeverity
          description?: string | null
          transcript_excerpt?: string | null
          ai_response_excerpt?: string | null
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          action_taken?: string | null
          created_at?: string
        }
        Update: {
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          action_taken?: string | null
        }
      }
    }
    Functions: {
      check_daily_session_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_user_with_memory: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          full_name: string
          email: string
          age_bracket: string
          session_count: number
          is_admin: boolean
          profile_json: Json
        }[]
      }
      is_user_admin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      reset_daily_session_counts: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      session_status: SessionStatus
      flag_severity: FlagSeverity
      flag_type: FlagType
    }
  }
}
