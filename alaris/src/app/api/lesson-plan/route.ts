/**
 * Lesson Plan Generation API
 * 
 * Called when user selects a topic.
 * Generates a detailed lesson plan using GPT-4o.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { generateLessonPlan, formatLessonPlanForPrompt } from '@/lib/lessons/generateLessonPlan';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const { topicTitle, userPriorKnowledge, userAge, userLocation, sessionCount } = await request.json();
    
    if (!topicTitle) {
      return NextResponse.json({ error: 'Topic title required' }, { status: 400 });
    }

    // 3. Generate lesson plan
    const lessonPlan = await generateLessonPlan({
      topicTitle,
      userPriorKnowledge: userPriorKnowledge || 'none stated',
      userAge,
      userLocation,
      sessionCount,
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Failed to generate lesson plan' }, { status: 500 });
    }

    // 4. Format for prompt injection
    const formattedPlan = formatLessonPlanForPrompt(lessonPlan);

    return NextResponse.json({
      success: true,
      lessonPlan,
      formattedPlan,
    });

  } catch (error) {
    console.error('Lesson plan API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

