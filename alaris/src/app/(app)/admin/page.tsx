import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { clientEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Header } from '@/components/ui/Header';

async function getAdminData() {
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
  
  if (!user) return { user: null, isAdmin: false };

  // Check if user is admin using admin client
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single();

  return { 
    user, 
    isAdmin: profile?.is_admin === true,
    userName: profile?.full_name || user.email?.split('@')[0] || 'Admin'
  };
}

export default async function AdminPage() {
  const { user, isAdmin, userName } = await getAdminData();
  
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  if (!isAdmin) {
    redirect('/session');
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <Header userName={userName} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-semibold text-[var(--oxford-blue)]"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Admin Dashboard
            </h1>
            <p className="text-[var(--slate)] text-sm sm:text-base">Monitor users, sessions, and platform health</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--gold)]/10 rounded-full shrink-0">
            <span className="w-2 h-2 bg-[var(--gold)] rounded-full"></span>
            <span className="text-sm font-medium text-[var(--gold-dark)]">Admin Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="text-sm text-[var(--slate)] mb-1">Total Users</div>
            <div className="text-3xl font-semibold text-[var(--oxford-blue)]">—</div>
            <div className="text-xs text-[var(--silver)] mt-1">All time</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--slate)] mb-1">Sessions Today</div>
            <div className="text-3xl font-semibold text-[var(--oxford-blue)]">—</div>
            <div className="text-xs text-[var(--silver)] mt-1">Since midnight</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--slate)] mb-1">Avg Engagement</div>
            <div className="text-3xl font-semibold text-[var(--oxford-blue)]">—</div>
            <div className="text-xs text-[var(--silver)] mt-1">Score /10</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-[var(--slate)] mb-1">Active Flags</div>
            <div className="text-3xl font-semibold text-[var(--oxford-blue)]">—</div>
            <div className="text-xs text-[var(--silver)] mt-1">Unreviewed</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Recent Sessions
            </h2>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[var(--oxford-blue)]/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[var(--silver)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[var(--slate)]">No sessions recorded yet</p>
              <p className="text-sm text-[var(--silver)] mt-2">
                Session data will appear here after Phase 5
              </p>
            </div>
          </div>

          {/* Moderation Queue */}
          <div className="card p-6">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Moderation Queue
            </h2>
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[var(--slate)]">All clear</p>
              <p className="text-sm text-[var(--silver)] mt-2">
                No flagged content requires review
              </p>
            </div>
          </div>

          {/* User Search */}
          <div className="card p-6 md:col-span-2">
            <h2 
              className="text-xl font-semibold text-[var(--oxford-blue)] mb-4"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              User Search
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by email or name..."
                className="input flex-1"
                disabled
              />
              <button className="btn-secondary" disabled>
                Search
              </button>
            </div>
            <p className="text-sm text-[var(--silver)] mt-4">
              User search functionality will be implemented in Phase 7
            </p>
          </div>
        </div>

        {/* Admin Notice */}
        <div className="mt-8 p-4 bg-[var(--oxford-blue)]/5 rounded-lg">
          <p className="text-sm text-[var(--slate)]">
            <strong>Admin Note:</strong> This dashboard is visible only to users with <code className="bg-white px-1.5 py-0.5 rounded text-xs">is_admin = true</code> in the database.
            Full admin functionality will be implemented in Phase 7.
          </p>
        </div>
      </main>
    </div>
  );
}
