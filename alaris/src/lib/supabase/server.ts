/**
 * Supabase Server Client (Admin)
 * 
 * This client runs on the server and bypasses Row Level Security (RLS).
 * ONLY use this in API routes and Server Components.
 * NEVER import this in Client Components.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Create admin client - uses process.env directly for reliability
// This runs in Node.js runtime (API routes, Server Components)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

