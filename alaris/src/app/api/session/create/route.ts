/**
 * Session Creation API - Generate Ephemeral Token
 * 
 * Creates a new tutorial session:
 * 1. Authenticates user
 * 2. Checks daily session limit
 * 3. Fetches learner profile
 * 4. Generates topic options
 * 5. Gets ephemeral token from OpenAI
 * 6. Creates session record
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateTopics, getQuickTopics } from '@/lib/topics/generateTopics';
import type { LearnerProfile } from '@/types/database-helpers';

// Default profile for new users
const DEFAULT_PROFILE: LearnerProfile = {
  interest_tags: [],
  known_topics: [],
  skill_dimensions: [],
  cognitive_style: { approach: 'unknown', verbosity: 'unknown' },
  open_loops: [],
  misconceptions_flagged: [],
  recent_topics: [],
};

export async function POST(request: NextRequest) {
  console.log('\n========== SESSION CREATE API ==========');
  console.log('🟢 [API] Session creation started');
  
  try {
    // 1. Authenticate user from session cookie
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
      console.log('🔴 [API] Auth failed:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }
    console.log('🟢 [API] User authenticated:', user.id);

    // 2. Check daily session limit
    const { data: canStart, error: limitError } = await supabaseAdmin
      .rpc('check_daily_session_limit', { p_user_id: user.id });

    if (limitError) {
      console.error('Error checking session limit:', limitError);
      return NextResponse.json(
        { error: 'Failed to check session limit.' },
        { status: 500 }
      );
    }

    if (!canStart) {
      return NextResponse.json(
        { 
          error: 'Daily session limit reached. Resets at midnight.',
          code: 'DAILY_LIMIT_REACHED'
        },
        { status: 429 }
      );
    }

    // 3. Fetch user profile and memory
    const [userResult, memoryResult] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('full_name, age_bracket, session_count')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('memories')
        .select('profile_json')
        .eq('user_id', user.id)
        .single()
    ]);

    const userRecord = userResult.data;
    const sessionCount = userRecord?.session_count || 0;
    const ageBracket = userRecord?.age_bracket || 'unknown';
    const userName = userRecord?.full_name || user.user_metadata?.full_name || '';

    const learnerProfile: LearnerProfile = memoryResult.data?.profile_json || DEFAULT_PROFILE;
    console.log('🟢 [API] Learner profile loaded');
    console.log('🟢 [API] Session count:', sessionCount, '| Age bracket:', ageBracket);

    // 4. Generate topic options (run in parallel with OpenAI token request)
    // Use quick topics first, then generate in background if needed
    let topics = getQuickTopics();
    
    // Try to generate personalized topics (with timeout)
    const topicPromise = generateTopics(learnerProfile, sessionCount)
      .then(generated => {
        if (generated && generated.length === 3) {
          topics = generated;
        }
      })
      .catch(err => {
        console.error('Topic generation failed, using defaults:', err);
      });

    // 5. Generate ephemeral token from OpenAI
    const sessionConfig = {
      session: {
        type: 'realtime',
        model: 'gpt-realtime',
        audio: {
          output: { 
            voice: 'sage'
          },
        },
      },
    };

    const [openaiResponse] = await Promise.all([
      fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionConfig),
      }),
      topicPromise // Wait for topics too
    ]);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create session with OpenAI.' },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();

    if (!data.value) {
      console.error('No ephemeral key in response:', data);
      return NextResponse.json(
        { error: 'Invalid response from OpenAI.' },
        { status: 500 }
      );
    }

    // 6. Create session record in database
    const { data: sessionRecord, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        status: 'active',
        started_at: new Date().toISOString(),
        topic_options: topics.map(t => t.title),
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Error creating session record:', sessionError);
      // Don't fail - session can still work
    }

    console.log('🟢 [API] Topics generated:', topics.map(t => t.title).join(', '));
    console.log('🟢 [API] Ephemeral key obtained');
    console.log('🟢 [API] Session ID:', sessionRecord?.id);
    console.log('========== SESSION CREATE COMPLETE ==========\n');
    
    return NextResponse.json({
      ephemeralKey: data.value,
      learnerProfile,
      userId: user.id,
      sessionId: sessionRecord?.id || null,
      topics,
      userName,
      ageBracket,
      sessionCount,
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
