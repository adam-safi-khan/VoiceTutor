import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Header } from '@/components/ui/Header';
import VoiceSession from '@/components/session/VoiceSession';

async function getUserData() {
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

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Fetch additional user data
  const { data: userRecord } = await supabase
    .from('users')
    .select('full_name, age_bracket, session_count')
    .eq('id', user.id)
    .single();
  
  return {
    id: user.id,
    email: user.email,
    fullName: userRecord?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    ageBracket: userRecord?.age_bracket || 'unknown',
    sessionCount: userRecord?.session_count || 0,
  };
}

export default async function SessionPage() {
  const userData = await getUserData();
  
  if (!userData) {
    redirect('/login?redirect=/session');
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Header userName={userData.fullName} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <VoiceSession 
          userId={userData.id}
          userName={userData.fullName}
          ageBracket={userData.ageBracket}
          sessionCount={userData.sessionCount}
        />

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="card p-6">
            <h3 
              className="text-lg font-semibold text-[var(--oxford-blue)] mb-2"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              How It Works
            </h3>
            <ul className="space-y-3 text-[var(--slate)] text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[var(--gold)] font-semibold">1.</span>
                Choose from 3 tailored topic options
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--gold)] font-semibold">2.</span>
                Engage in Socratic dialogue with your tutor
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--gold)] font-semibold">3.</span>
                Build cognitive skills through exploration
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--gold)] font-semibold">4.</span>
                Reflect and synthesize at the end
              </li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 
              className="text-lg font-semibold text-[var(--oxford-blue)] mb-2"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Session Guidelines
            </h3>
            <ul className="space-y-3 text-[var(--slate)] text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)]">•</span>
                Find a quiet space with good audio
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)]">•</span>
                Sessions last approximately 30 minutes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)]">•</span>
                One session per day (resets at midnight)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)]">•</span>
                You can pause and resume if needed
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
