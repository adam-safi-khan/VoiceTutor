import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { clientEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/session';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=No authorization code received', requestUrl.origin)
    );
  }

  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (data.user) {
      // Check if user profile exists in our public.users table
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // If no profile exists (new OAuth user), create one
      if (!existingProfile) {
        const fullName = data.user.user_metadata?.full_name 
          || data.user.user_metadata?.name 
          || data.user.email?.split('@')[0] 
          || 'User';

        // For OAuth users without DOB, we'll need to collect it later
        // For now, set a placeholder that indicates they need to complete profile
        // Using a date that makes them 18 (adult default)
        const placeholderDOB = new Date();
        placeholderDOB.setFullYear(placeholderDOB.getFullYear() - 18);

        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            full_name: fullName,
            email: data.user.email!,
            date_of_birth: placeholderDOB.toISOString().split('T')[0],
            location: null,
          });

        if (profileError) {
          console.error('Failed to create profile for OAuth user:', profileError);
          // Don't fail the login, but log the error
          // The user can still use the app, but profile might be incomplete
        }
      }
    }

    // Successful auth - redirect to the intended destination
    return NextResponse.redirect(new URL(redirect, requestUrl.origin));

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=Authentication failed. Please try again.', requestUrl.origin)
    );
  }
}

