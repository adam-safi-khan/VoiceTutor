/**
 * Authentication Utilities
 */

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Get current user (client-side)
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Sign out (client-side)
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// Check if user is admin (requires database call)
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .rpc('is_user_admin', { p_user_id: userId });
  return data === true;
}

