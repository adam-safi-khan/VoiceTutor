# Alaris Voice Tutor - Comprehensive Implementation Plan

**Project Vision**: A state-of-the-art voice tutoring experience that trains cognitive skills (not just knowledge) through Oxford-style tutorial conversations, powered by cutting-edge AI.

**Core Philosophy**: Train 9 cognitive skill dimensions—argumentation, explanation, epistemic humility, question-asking, transfer, metacognition, etc.—not just topic knowledge. Each 30-minute session moves through a structured pedagogical arc while maintaining a rich internal learner model.

**Tech Stack**: Next.js 14+ (App Router), OpenAI Realtime API (WebRTC via Agents SDK, `gpt-realtime` model), GPT-4o/GPT-5 for summaries/analysis, Supabase (Auth + PostgreSQL), Google Places API, Vercel (London region)

---

## PHASE 0 — Project & Infrastructure Setup

**Goal**: Establish production-ready foundation with all core dependencies.

### 0.0 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter project details:
   - Name: "Alaris Voice Tutor"
   - Database Password: Generate strong password (save in password manager!)
   - Region: **London** (closest to Vercel deployment)
   - Pricing: Free tier (for development/MVP)
4. Wait ~2 mins for project to provision
5. Once ready, navigate to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "Reveal" button) → `SUPABASE_SERVICE_ROLE_KEY`
6. Save these for `.env.local` in step 0.3

**Test**: Project dashboard accessible, API keys copied.

### 0.1 — Create Next.js Application
- Run: `npx create-next-app@latest alaris --ts --eslint --app --tailwind --src-dir`
- Clean boilerplate from `src/app/page.tsx` and `globals.css`
- Configure `next.config.ts`: `reactStrictMode: true`

**Test**: Dev server runs on `:3000`, hot reload works, Tailwind styles apply, `npm run build` succeeds.

### 0.2 — Install Core Dependencies
```bash
npm install @openai/agents zod @supabase/supabase-js @supabase/ssr date-fns clsx
npm install -D @types/node
```

**Test**: `npm install` completes, imports work, no peer dependency warnings.

### 0.3 — Configure Environment Variables
Create `.env.local`:
```bash
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Create `src/lib/env.ts` for type-safe access with server/client separation.

**Test**: Env vars load on server start, server-only vars are `undefined` on client (security check).

### 0.4 — Set Up Supabase Clients
- `src/lib/supabase/client.ts`: Browser client (anon key, respects RLS)
- `src/lib/supabase/server.ts`: Admin client (service role, bypasses RLS - server only!)
- `src/lib/supabase/middleware.ts`: Auth helpers for route protection

**Test**: Browser client connects, admin client works in API routes, TypeScript prevents admin import in client components.

### 0.5 — Create Base File Structure
```
src/
├── app/
│   ├── (marketing)/page.tsx
│   ├── (app)/session/page.tsx
│   ├── (app)/account/page.tsx
│   ├── (app)/admin/page.tsx
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   └── api/
│       ├── session/route.ts
│       ├── session-end/route.ts
│       └── memory/route.ts
├── components/ui/
├── lib/
│   ├── openai/prompts/
│   ├── memory/
│   ├── topics/
│   └── utils/
└── types/
```

Create placeholder pages/routes with TODO comments. Create `src/lib/topics/examples.md` with topic generation guidelines.

**Test**: All routes accessible, API routes return JSON, no TypeScript errors, build succeeds.

---

## PHASE 1 — Authentication & User Model

**Goal**: Secure, minimal-friction auth with essential user data only.

### 1.1 — Database Schema Design

**In Supabase SQL Editor**, create tables:

**`users` table**: Basic profile (auth_id, full_name, email, date_of_birth, location, auto-calculated age_bracket, session tracking, is_admin BOOLEAN DEFAULT FALSE)

**`sessions` table**: Session tracking (user_id, timing, topic chosen/options, transcript, summary, engagement metrics, status)

**`memories` table**: Learner profiles (user_id, profile_json with interest_tags, known_topics, 9 skill_dimensions, cognitive_style, open_loops, misconceptions, recent_topics)

**`moderation_logs` table**: Safety tracking (session_id, user_id, flag_type, severity, reviewed status)

**Key features**:
- RLS enabled on all tables
- Triggers: Auto-create memory on user creation, update user stats on session completion
- Function: `check_daily_session_limit(user_id)` returns boolean
- Constraints: age >= 13, engagement_score 0-10, valid enums

**Test**: Run SQL blocks, verify tables exist with correct columns, test RLS policies, verify triggers fire (insert test user, check memory auto-created), test constraints (try invalid data).

### 1.2 — Generate TypeScript Types
```bash
supabase gen types typescript --linked > src/types/database.ts
```

Create `src/types/database-helpers.ts` with helper types (`User`, `Session`, `Memory`, `LearnerProfile` interface, `SkillDimension` interface, etc.)

**Test**: Types generated, autocomplete works, Supabase clients typed (`createBrowserClient<Database>`).

### 1.3 — Build Signup Flow

**Setup Google Places API**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Places API" 
4. Create API key, restrict to Places API + your domain
5. Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-key`

**`src/app/(auth)/signup/page.tsx`**: Form with 6 fields (name, email, password, confirm, DOB, location with Google Places Autocomplete). Client-side validation (password length, age check, password match).

Use `@react-google-maps/api` or Google Places Autocomplete widget for location field.

**`src/app/api/auth/signup/route.ts`**: 
- Validate input + age >= 13
- Create auth user via `supabaseAdmin.auth.admin.createUser()`
- Create profile in `users` table
- Memory auto-created by trigger
- Handle errors with rollback

**Test**: Form validates client-side, successful signup creates auth user + profile + memory, duplicate email rejected, age < 13 rejected, redirects to `/session` on success.

### 1.4 — Build Login Flow

**`src/app/(auth)/login/page.tsx`**: Email/password form + "Sign in with Google" button.

**Login logic**: `supabase.auth.signInWithPassword()` for email/password, `supabase.auth.signInWithOAuth({ provider: 'google' })` for OAuth.

**Auth callback route** (`src/app/auth/callback/route.ts`): Handle OAuth redirects, exchange code for session.

**Test**: Email login works, Google OAuth works, invalid credentials show error, successful login redirects to `/session`.

### 1.5 — Route Protection with Middleware

**`src/middleware.ts`**: Check auth on protected routes (`/session`, `/account`, `/admin`), refresh session tokens, redirect to `/login` if unauthenticated.

Admin route: Additional check for `is_admin = true` in users table. Query user record, if not admin, redirect to `/session`.

**Test**: Unauthenticated access to `/session` redirects to login, authenticated access works, admin routes protected.

---

## PHASE 2 — Realtime Voice Plumbing

**Goal**: Browser connects to OpenAI Realtime API via WebRTC for voice conversations.

### 2.1 — Create Ephemeral Token Endpoint

**`src/app/api/session/create/route.ts`** (CRITICAL - actual code):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  // 1. Authenticate user (get from session cookie)
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Check daily session limit
  const { data: canStart } = await supabaseAdmin
    .rpc('check_daily_session_limit', { p_user_id: user.id });
    
  if (!canStart) {
    return NextResponse.json({ 
      error: 'Daily session limit reached. Resets at midnight.' 
    }, { status: 429 });
  }
  
  // 3. Fetch learner profile
  const { data: memory } = await supabaseAdmin
    .from('memories')
    .select('profile_json')
    .eq('user_id', user.id)
    .single();
  
  const learnerProfile = memory?.profile_json || {};
  
  // 4. Generate ephemeral token from OpenAI
  const sessionConfig = {
    session: {
      type: 'realtime',
      model: 'gpt-realtime', // Specialized realtime model (per OpenAI docs)
      audio: {
        output: { voice: 'coral' }, // or from user.preferred_voice
      },
    },
  };
  
  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serverEnv.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionConfig),
  });
  
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
  
  const data = await response.json();
  
  return NextResponse.json({
    ephemeralKey: data.value, // e.g., "ek_..."
    learnerProfile,
    userId: user.id,
  });
}
```

**Test**: Call endpoint with auth token, returns ephemeral key, checks daily limit, fetches profile.

### 2.2 — Frontend WebRTC Connection

**`src/components/session/VoiceSession.tsx`** (CRITICAL - core logic):
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

export default function VoiceSession() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const sessionRef = useRef<RealtimeSession | null>(null);
  
  const startSession = async () => {
    setStatus('connecting');
    
    try {
      // 1. Get ephemeral token from backend
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Get from Supabase session
      });
      
      const { ephemeralKey, learnerProfile } = await response.json();
      
      // 2. Create agent with system instructions + learner profile
      const agent = new RealtimeAgent({
        name: 'Alaris Tutor',
        instructions: getTutorPrompt(learnerProfile), // From Phase 3
      });
      
      // 3. Create session and connect via WebRTC
      const session = new RealtimeSession(agent);
      sessionRef.current = session;
      
      await session.connect({ apiKey: ephemeralKey });
      
      setStatus('connected');
      
      // 4. Listen for transcript updates
      session.on('transcript.update', (text) => {
        setTranscript(prev => [...prev, text]);
      });
      
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('error');
    }
  };
  
  const endSession = async () => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      // Call /api/session-end with transcript
    }
  };
  
  return (
    <div className="p-8">
      {status === 'idle' && (
        <button onClick={startSession} className="btn-primary">
          Start Session
        </button>
      )}
      {status === 'connected' && (
        <>
          <div className="waveform-indicator">🎙️ Listening...</div>
          <button onClick={endSession}>End Session</button>
          <div className="transcript">{transcript.join('\n')}</div>
        </>
      )}
    </div>
  );
}
```

**Test**: Click Start → mic permission requested → connects to OpenAI → voice conversation works → transcript displays → End Session saves.

### 2.3 — Session State Management

- Display connection status (Connecting → Listening → Processing)
- Show waveform/visual indicator during speech
- Track session start time, update elapsed time every minute
- Show warning at 32 minutes: "Session will end in 3 minutes"
- At 35 minutes: Auto-end session, save data
- Send time updates to AI every 5 minutes so it knows to pace content

**Test**: UI updates on state changes, timer works, warning appears, auto-end triggers at 35min.

### 2.4 — Pause & Restart Controls

**Pause**: Mute microphone + send "User paused session" event to AI, show "Resume" button.

**Restart** (first 5 mins only): Confirm dialog → disconnect → clear transcript → create new session.

**Multi-device**: Store session_id in database with `resume_token`, allow reconnection from different device (check documentation for feasibility with WebRTC).

**Test**: Pause stops audio input, resume continues conversation, restart creates fresh session, restart button disabled after 5 mins.

---

## PHASE 3 — Tutorial System Prompt & Session Flow

**Goal**: AI delivers Oxford-style tutorials following structured pedagogical phases.

### 3.1 — Core Tutorial System Prompt (CRITICAL)

**`src/lib/openai/prompts/tutorPrompt.ts`**:
```typescript
import { LearnerProfile } from '@/types/database-helpers';

export function getTutorPrompt(profile: LearnerProfile, timeRemaining?: number): string {
  return `
# IDENTITY & ROLE
You are an Alaris tutor—a warm, rigorous thinking partner inspired by Oxford tutorials. Your goal is to train cognitive skills (argumentation, explanation, epistemic humility, transfer, metacognition) through Socratic dialogue, not just teach facts.

# LEARNER CONTEXT
${profile.session_count < 3 ? '⚠️ EARLY SESSION: User is new. Be extra welcoming, explain your approach, prioritize enjoyment over coverage.' : ''}

Interest Tags: ${profile.interest_tags.join(', ') || 'Unknown yet'}
Known Topics: ${profile.known_topics.map(t => `${t.name} (${t.level})`).join(', ')}
Cognitive Style: ${profile.cognitive_style.approach}, ${profile.cognitive_style.verbosity}
Recent Topics: ${profile.recent_topics.join(', ')}

Open Loops to Consider: ${profile.open_loops.map(l => l.content).join('; ')}

# SESSION STRUCTURE (~30 mins${timeRemaining ? `, ${timeRemaining} mins remaining` : ''})

## Phase 0: Warm Entry (2-4 mins)
- Greet warmly via voice
- Offer 3 topic options (generate dynamically based on profile, avoid recent topics)
  Format: "I've got three ideas: [1] short description, [2] ..., [3] ..."
- After choice: "Awesome! Do you know anything about this already? Totally fine if not."
- Ask: "Any of the other options you'd want to revisit later?"

## Phase 1: Open Diagnostic (3-5 mins)
- Open question: "What do you know about [topic]?"
- Follow-up: "Why do you think that?" / "Where'd you pick that up?"
- Gauge level, identify misconceptions

## Phase 2: Scaffolded Model-Building (10-15 mins)
- Explain in small chunks, check understanding: "Explain that back to me"
- Hypotheticals: "Imagine you're [role]. What would you do?"
- Contrast: "What's the difference between X and Y?"

## Phase 3: Deepening & Challenge (5-10 mins)
- Pose chewy problem (e.g., "If Parliament didn't exist, what would force the King to share power?")
- Let them struggle, probe reasoning, offer counterarguments
- Introduce 1-2 expert insights

## Phase 4: Transfer & Connection (3-5 mins)
- Link to different domain / modern life: "Does this remind you of anything today?"
- Make abstract concrete

## Phase 5: Reflection & Synthesis (3-5 mins)
- "Summarize our discussion in 3 points"
- "What surprised you?" / "Where were you confused?"
- "What would you want to dig into next time?"
- Close warmly: "You thought carefully about X today—this is how great thinkers develop."

# TONE & STYLE
- Warm, never condescending, no over-apologizing
- 2-3 sentences per turn (unless explaining complex concept)
- Speak fast but not rushed (adjust pacing in audio)
- Vary phrasing—don't sound robotic
- ALL CAPS for critical rules that model must follow

# LANGUAGE
- Mirror user's language if intelligible, default to English if unclear
- If audio unclear/noisy/silent: "Sorry, didn't catch that—could you repeat?"

# TOOLS & ACTIONS
- Before tool calls: Say "Let me check that now" then call tool
- For destructive actions: Confirm first

# AGE-APPROPRIATE CONTENT
User Age: ${calculateAge(profile)} years old
- For 13-15: Simpler framing, more narrative-driven
- For 16+: Full complexity OK

# SKILL TRAINING FOCUS (log observations for each)
1. Explanatory: Can they explain back? Build mental models?
2. Argumentation: Reasons vs opinions? See counterarguments?
3. Hypothetical: Engage with "what if"?
4. Epistemic: Calibrated confidence? Know what they don't know?
5. Metacognition: Aware of their thinking process?
6. Synthesis: Compress learnings?
7. Question-asking: Sharpen vague curiosity?
8. Transfer: Connect to life/other domains?
9. Affective: Enjoy thinking? Resilient to difficulty?

# CRITICAL RULES
- IF user is silent/confused for >15 seconds, ASK "Still with me? Want me to approach this differently?"
- IF topic goes off-rails and time is limited, GENTLY REDIRECT
- DO NOT lecture for >2 minutes straight—check understanding
- IF time < 5 mins remaining, BEGIN WRAP-UP (reflection phase)
- NEVER repeat exact same phrase twice
- ALWAYS acknowledge good reasoning, even if answer is wrong
`;
}

function calculateAge(profile: LearnerProfile): number {
  // Calculate from profile or default
  return 18; // Implement properly
}
```

**Test**: Prompt loads with profile data, AI follows phases, tone is warm/rigorous, pacing adapts to time remaining.

### 3.2 — Topic Generation System

**`src/lib/topics/generateTopics.ts`**: Function that calls GPT-4o/GPT-5 with learner profile + topic examples.md to generate 3 tailored topics. Consider diversity (avoid recent), align with interest_tags, appropriate difficulty.

Topics formatted as: `{ id, title, description, difficulty_estimate, cognitive_focus[] }`

**Test**: Generated topics are specific, accessible, cognitively rich, not repetitive.

### 3.3 — Session Event Handling

Handle events from Realtime API:
- `conversation.item.created`: Log user/AI messages for transcript
- `response.output_audio.done`: Track AI talk time
- `input_audio_buffer.speech_started`: Track user talk time, count interruptions
- Custom events: Topic selection (when user picks from 3 options, send as text event)

**Test**: Events logged correctly, transcript builds, metrics tracked.

### 3.4 — Dynamic Prompt Updates

Every 5 minutes, send `session.update` with:
- Time remaining
- Current phase hint (if AI seems stuck)
- User engagement signals (if they seem confused/bored)

**Test**: AI aware of time, adjusts pacing when time low.

---

## PHASE 4 — Memory System & Learner Profile

**Goal**: Persistent, evolving learner profiles that improve tutorial personalization.

### 4.1 — Profile Update Logic (CRITICAL)

**`src/lib/memory/updateProfile.ts`**:
```typescript
import { LearnerProfile, SessionSummary } from '@/types/database-helpers';
import { serverEnv } from '@/lib/env';

export async function updateLearnerProfile(
  currentProfile: LearnerProfile,
  sessionSummary: SessionSummary,
  transcript: string
): Promise<LearnerProfile> {
  
  const prompt = `You are an expert educational psychologist updating a learner profile.

CURRENT PROFILE:
${JSON.stringify(currentProfile, null, 2)}

LATEST SESSION SUMMARY:
Topic: ${sessionSummary.topic}
Main Ideas: ${sessionSummary.main_ideas_covered.join(', ')}
Strengths: ${sessionSummary.user_strengths.join(', ')}
Struggles: ${sessionSummary.user_struggles.join(', ')}
Skill Observations: ${JSON.stringify(sessionSummary.skill_observations)}

TRANSCRIPT EXCERPTS:
${transcript.slice(0, 3000)} ... [truncated]

TASK: Update the learner profile JSON. Guidelines:
1. ADD new interest_tags if clear interests emerged
2. UPDATE known_topics: Add new topic, adjust mastery levels (unknown→fragile→usable→robust)
3. UPDATE skill_dimensions: For each dimension observed, update level + notes + trend
4. UPDATE cognitive_style based on conversation patterns
5. ADD to open_loops if user expressed curiosity
6. ADD to misconceptions_flagged if misunderstandings detected
7. UPDATE recent_topics (keep last 10)

Be conservative with skill level upgrades (requires consistent evidence over multiple sessions).
Be specific in notes (quote examples from transcript).

OUTPUT: Return ONLY the updated LearnerProfile JSON, no other text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serverEnv.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Use latest available: gpt-4o, gpt-5, or o1 for reasoning
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

**Test**: Profile updates reflect session observations, skill levels increase with evidence, open loops captured, misconceptions flagged.

### 4.2 — Session Summary Generation

**`src/lib/analytics/generateSummary.ts`**: Similar GPT-4o/GPT-5 call that takes transcript → produces `SessionSummary` (topic, main_ideas_covered, user_strengths, user_struggles, open_loops_created, skill_observations, recommended_next_topics).

**Note**: All non-realtime AI tasks (summaries, profile updates, topic generation) use standard frontier models (gpt-4o, gpt-5, o1), NOT gpt-realtime.

**Test**: Summaries accurate, identify key moments, extract open loops, recommend relevant next topics.

### 4.3 — Memory Update API

**`src/app/api/memory/route.ts`**: Receives session_id, fetches session + current profile, calls `updateLearnerProfile()`, saves to database, increments session_count.

**Test**: Called after session end, profile updated in DB, session_count increments, calibration_warning becomes false after 3 sessions.

---

## PHASE 5 — Session Logging & Analytics

**Goal**: Track everything for iteration and debugging.

### 5.1 — Session End Flow

**`src/app/api/session-end/route.ts`**:
1. Mark session as 'completed', set ended_at, calculate duration
2. Save full transcript
3. Generate summary (call GPT-4)
4. Calculate engagement_score: Based on duration, talk time balance, interruptions, questions asked
5. Trigger memory update (`POST /api/memory`)

**Test**: Session saved with all metrics, summary generated, engagement score calculated, memory updated.

### 5.2 — Engagement Score Calculation

**Formula**: Weighted combination of:
- Completion % (0-100%)
- Talk time balance (ideal: 60% user / 40% AI)
- User questions asked (more = better)
- Low interruptions (indicates flow)
- Session duration (closer to 30 mins = better)

Output: 0-10 score.

**Test**: Scores correlate with actual engagement, edge cases handled (very short sessions, technical issues).

### 5.3 — Account Page Display

**`src/app/(app)/account/page.tsx`**:
- List past sessions (date, topic, duration, engagement score)
- Show learner profile: Interest tags, skill dimensions (with disclaimer if <3 sessions)
- Show open loops: "Topics you wanted to explore"
- Charts: Sessions over time, engagement trend

**Test**: Sessions display correctly, profile shows with calibration warning, open loops listed.

---

## PHASE 6 — UX & Mobile Polish

**Goal**: Production-ready interface with mobile optimization.

### 6.1 — Session UI Enhancements

- Large "Start Session" button on session page
- During session: Animated waveform indicator, subtle phase label ("Exploring..."), topic options as clickable buttons
- Pause/Resume/End Session buttons always visible
- Timer display (MM:SS elapsed)
- Warning banner at 32 minutes
- Loading states for all async actions

**Test**: UI intuitive, mobile-friendly (test on phone), animations smooth, buttons responsive.

### 6.2 — Mobile Optimization

- Test mic permissions on iOS Safari, Chrome Android
- Ensure text legible (min 16px)
- Touch targets ≥44px
- Test landscape/portrait
- Handle network interruptions gracefully

**Test**: Works on iPhone and Android, mic access prompts correctly, UI adapts to screen size.

### 6.3 — Error Handling

- Connection failures: Clear message + retry button
- Auth failures: Redirect to login
- Daily limit reached: Show countdown to midnight reset
- Technical issues: Offer "Report Problem" button (logs to moderation table)

**Test**: All error states handled, user never sees raw errors, always has path forward.

---

## PHASE 7 — Internal Tools & Testing

**Goal**: Admin tools for oversight and iteration.

### 7.1 — Admin Dashboard

**`src/app/(app)/admin/page.tsx`** (protected route):
- Stats: Total users, sessions today/week, avg engagement
- Recent sessions table (user, topic, duration, engagement, view transcript button)
- User search: View any user's profile + sessions
- Moderation logs table (unreviewed flags highlighted)

**Test**: Admin can view all data, search works, moderation flags visible.

### 7.2 — Session QA Protocol

Run 20 full sessions yourself:
- Test different age brackets
- Test various topics
- Intentionally go off-topic
- Test interruptions, pauses, restarts
- Note issues: Repetitive phrasing, shallow coverage, missing transitions

Iterate on system prompt based on findings. Consider adding explicit phase transition messages if AI doesn't transition reliably.

**Test**: AI behavior improves with each prompt iteration, fewer issues over time.

---

## PHASE 8 — Beta Launch Readiness

**Goal**: Ship-ready product with all core features working.

### 8.1 — Pre-Launch Checklist

**Infrastructure**:
- [ ] Deployed to Vercel (London region)
- [ ] Custom domain configured
- [ ] Environment variables set in Vercel
- [ ] Database indexed and optimized
- [ ] RLS policies verified

**Features**:
- [ ] Signup/login working
- [ ] Daily session limit enforced
- [ ] Full voice session flow (30 mins)
- [ ] Session saves and updates profile
- [ ] Account page shows history
- [ ] Mobile-responsive

**Quality**:
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All API routes authenticated
- [ ] Error messages user-friendly
- [ ] Loading states everywhere

**Content**:
- [ ] System prompt refined (20+ test sessions)
- [ ] Topic generation diverse and engaging
- [ ] Age-appropriate content filtering

**Analytics**:
- [ ] Admin dashboard accessible
- [ ] Session metrics tracking
- [ ] Engagement scoring working
- [ ] Moderation logging active

### 8.2 — Beta User Onboarding

- Create onboarding email template
- Set up user feedback form (post-session survey - optional)
- Plan weekly check-ins with first 10 beta users

### 8.3 — Monitoring & Iteration

- Set up Vercel analytics
- Monitor OpenAI API costs (set budget alerts)
- Track key metrics: Sign-ups, session completion rate, avg engagement, daily active users
- Weekly review of moderation logs
- Bi-weekly review of session transcripts for prompt improvements

---

## 🚀 FINAL VALIDATION

Before inviting beta users, complete full user journey:

1. **New User**:
   - [ ] Sign up with valid data → redirects to session
   - [ ] Click "Start Session" → mic permission granted
   - [ ] Session connects → AI greets and offers 3 topics
   - [ ] Pick topic → conversation flows through phases
   - [ ] Session lasts ~30 mins → ends gracefully
   - [ ] Session appears in account page with summary

2. **Returning User**:
   - [ ] Log in → redirected to session page
   - [ ] Check daily limit (try starting 2nd session same day → blocked)
   - [ ] Next day: Can start new session
   - [ ] New topics avoid recent topics
   - [ ] AI references previous session (if relevant)

3. **Edge Cases**:
   - [ ] Network disconnect mid-session → error message + ability to restart
   - [ ] Browser refresh mid-session → shows "session in progress" warning
   - [ ] Restart session (within 5 mins) → works
   - [ ] Restart button disabled after 5 mins
   - [ ] Session auto-ends at 35 mins

4. **Admin View**:
   - [ ] Admin can view all sessions
   - [ ] Moderation flags visible
   - [ ] Can read transcripts
   - [ ] Stats accurate

**If all ✅**: 🎉 **Ready for Beta Launch!**

---

## ANALYTICS TO TRACK

**Key Metrics** (log to database or external analytics):

1. **Acquisition**: Signups per day, conversion rate (landing → signup)
2. **Activation**: % of signups who complete first session
3. **Engagement**: 
   - Avg session duration
   - Avg engagement score
   - % of sessions completed (not abandoned)
   - Sessions per user (weekly/monthly)
4. **Retention**: 
   - Day 1/7/30 return rate
   - Weekly active users
5. **Quality**:
   - Skill dimension trends (are users improving?)
   - Open loop fulfillment rate (do open loops get addressed?)
   - Topic diversity (are we repeating?)
6. **Technical**:
   - API latency (session creation time)
   - Connection failure rate
   - Average API cost per session
7. **Safety**:
   - Moderation flags per 100 sessions
   - Flag severity distribution

---

## FUTURE ENHANCEMENTS (Post-Beta)

Not part of MVP, but consider for v2:

- **Voice selection**: Let user choose from multiple voices
- **Session scheduling**: Book sessions in advance
- **Streak tracking**: Gamification (maintain daily streak)
- **Social features**: Share favorite moments (anonymized)
- **Parent dashboard**: For under-18 users, optional parent view
- **Multi-language support**: Non-English tutorials
- **Accessibility**: Screen reader support, captions
- **Advanced analytics**: Skill improvement visualization, learning path recommendations
- **Topic requests**: User can request specific topics
- **Collaborative sessions**: Multi-user tutorials
- **Expert mode**: Unlock harder topics after consistent performance

---

## DEVELOPMENT WORKFLOW

**Daily Process**:
1. Check this doc for next uncompleted section
2. Implement feature
3. Run human testing protocol
4. Check all boxes
5. If all pass → mark section complete, move to next
6. If any fail → debug, rollback if needed, re-test

**Weekly Review**:
- Review completed sections
- Test integration between phases
- Run full user journey
- Update this doc with learnings

**Before Beta**:
- Complete all Phase 0-8 sections
- Pass final validation checklist
- Deploy to production
- Invite first 10 users

---

**This document is your single source of truth. When in doubt, refer back to the Core Philosophy and Testing Protocols. Build deliberately, test thoroughly, ship confidently.**
