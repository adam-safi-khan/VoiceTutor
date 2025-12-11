import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { clientEnv } from '@/lib/env';
import { Header } from '@/components/ui/Header';

async function getUserData() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user profile from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's memory/learner profile
  const { data: memory } = await supabase
    .from('memories')
    .select('profile_json')
    .eq('user_id', user.id)
    .single();

  return { user, profile, memory };
}

export default async function AccountPage() {
  const data = await getUserData();
  
  if (!data) {
    redirect('/login?redirect=/account');
  }

  const { user, profile, memory } = data;
  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const sessionCount = profile?.session_count || 0;
  const isCalibrating = sessionCount < 3;

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Header userName={userName} />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="card-elevated p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 bg-[var(--oxford-blue)] rounded-full flex items-center justify-center shrink-0">
              <span 
                className="text-3xl font-semibold text-white"
                style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
              >
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 
                className="text-2xl font-semibold text-[var(--oxford-blue)] mb-1"
                style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
              >
                {userName}
              </h1>
              <p className="text-[var(--slate)]">{user.email}</p>
              {profile?.location && (
                <p className="text-sm text-[var(--silver)] mt-1">{profile.location}</p>
              )}
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-semibold text-[var(--oxford-blue)]">{sessionCount}</div>
              <div className="text-sm text-[var(--slate)]">Sessions Completed</div>
            </div>
          </div>
        </div>

        {/* Calibration Notice */}
        {isCalibrating && (
          <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--gold-dark)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--oxford-blue)]">Calibrating your profile</p>
                <p className="text-sm text-[var(--slate)]">
                  Complete {3 - sessionCount} more session{3 - sessionCount !== 1 ? 's' : ''} for accurate skill assessments.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Session History */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Session History
            </h2>
            {sessionCount === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[var(--oxford-blue)]/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[var(--silver)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[var(--slate)] mb-4">No sessions yet</p>
                <a href="/session" className="text-[var(--oxford-blue)] text-sm font-medium hover:underline">
                  Start your first session →
                </a>
              </div>
            ) : (
              <p className="text-[var(--slate)] text-sm">
                Session history will appear here after Phase 5 implementation.
              </p>
            )}
          </div>

          {/* Skill Dimensions */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Cognitive Skills
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Explanatory', desc: 'Building mental models' },
                { name: 'Argumentation', desc: 'Reasoning & counterarguments' },
                { name: 'Epistemic', desc: 'Knowing what you don\'t know' },
                { name: 'Metacognition', desc: 'Thinking about thinking' },
                { name: 'Transfer', desc: 'Connecting across domains' },
              ].map((skill) => (
                <div key={skill.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--charcoal)]">{skill.name}</div>
                    <div className="text-xs text-[var(--silver)]">{skill.desc}</div>
                  </div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--oxford-blue)]/30 rounded-full"
                      style={{ width: '50%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {isCalibrating && (
              <p className="text-xs text-[var(--silver)] mt-4 text-center">
                Skills will be assessed after 3 sessions
              </p>
            )}
          </div>

          {/* Open Loops */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Topics to Explore
            </h2>
            <p className="text-[var(--slate)] text-sm">
              When you express curiosity about a topic during sessions, it will appear here for future exploration.
            </p>
          </div>

          {/* Interests */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Your Interests
            </h2>
            <p className="text-[var(--slate)] text-sm">
              Interest tags will be populated as you explore topics in your sessions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
