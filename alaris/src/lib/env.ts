/**
 * Environment Variables Configuration
 * 
 * This file provides type-safe access to environment variables with
 * proper server/client separation for security.
 */

// Server-only environment variables (NEVER exposed to client)
export const serverEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Client-safe environment variables (can be exposed to browser)
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
};

// Validation function (call during app initialization)
export function validateEnv() {
  const missingVars: string[] = [];

  if (!serverEnv.OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env.local file.`
    );
  }
}

// Type exports for TypeScript autocomplete
export type ServerEnv = typeof serverEnv;
export type ClientEnv = typeof clientEnv;

