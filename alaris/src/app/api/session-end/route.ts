/**
 * Session End API
 * 
 * Handles session completion:
 * 1. Marks session as completed
 * 2. Saves transcript and observations
 * 3. Calculates engagement score
 * 4. Updates user session count
 * 
 * Note: Full summary generation and memory update is Phase 5
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { SessionEndPayload } from '@/types/session';

/**
 * Calculate engagement score (0-10) based on session metrics
 */
function calculateEngagementScore(payload: SessionEndPayload): number {
  const { transcript, duration, skillObservations } = payload;
  
  // Base score
  let score = 5;
  
  // Duration factor (30 mins ideal)
  const idealDuration = 30 * 60; // 30 minutes in seconds
  const durationRatio = Math.min(duration / idealDuration, 1);
  score += durationRatio * 2; // Up to +2 for full duration
  
  // Transcript length factor
  const userTurns = transcript.filter(t => t.role === 'user').length;
  const assistantTurns = transcript.filter(t => t.role === 'assistant').length;
  
  // Good conversation has back-and-forth
  if (userTurns >= 5 && assistantTurns >= 5) {
    score += 1;
  }
  if (userTurns >= 10 && assistantTurns >= 10) {
    score += 1;
  }
  
  // Skill observations indicate engagement
  if (skillObservations.length >= 3) {
    score += 0.5;
  }
  if (skillObservations.length >= 6) {
    score += 0.5;
  }
  
  // Cap at 10
  return Math.min(Math.round(score * 10) / 10, 10);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const payload: SessionEndPayload = await request.json();
    
    if (!payload.sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // 3. Calculate engagement score
    const engagementScore = calculateEngagementScore(payload);

    // 4. Update session record
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: payload.duration,
        transcript: payload.transcript,
        engagement_score: engagementScore,
        // Store observations in a structured way
        summary: {
          skill_observations: payload.skillObservations,
          open_loops: payload.openLoops,
          lesson_plan_modifications: payload.lessonPlanMods,
          misconceptions: payload.misconceptions,
          final_phase: payload.phase,
          topic: payload.topicChosen?.title || null,
        }
      })
      .eq('id', payload.sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      // Don't fail - try to update user stats anyway
    }

    // 5. Increment user session count
    const { error: userUpdateError } = await supabaseAdmin
      .rpc('increment_session_count', { p_user_id: user.id });

    if (userUpdateError) {
      console.error('Error updating user session count:', userUpdateError);
    }

    // 6. Store open loops in memory for future sessions
    if (payload.openLoops && payload.openLoops.length > 0) {
      const { data: memory } = await supabaseAdmin
        .from('memories')
        .select('profile_json')
        .eq('user_id', user.id)
        .single();

      if (memory?.profile_json) {
        const profile = memory.profile_json;
        const existingLoops = profile.open_loops || [];
        
        // Add new loops, converting format
        const newLoops = payload.openLoops.map(loop => ({
          content: loop.topic,
          created_at: new Date().toISOString(),
          topic: loop.context,
          priority: loop.priority
        }));
        
        // Keep last 20 open loops
        const updatedLoops = [...newLoops, ...existingLoops].slice(0, 20);
        
        // Update recent topics
        const recentTopics = profile.recent_topics || [];
        if (payload.topicChosen?.title) {
          recentTopics.unshift(payload.topicChosen.title);
        }
        
        await supabaseAdmin
          .from('memories')
          .update({
            profile_json: {
              ...profile,
              open_loops: updatedLoops,
              recent_topics: recentTopics.slice(0, 10)
            }
          })
          .eq('user_id', user.id);
      }
    }

    return NextResponse.json({
      success: true,
      engagementScore,
      message: 'Session saved successfully'
    });

  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}
