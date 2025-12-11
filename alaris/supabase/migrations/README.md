# Supabase Database Migrations

Run these SQL files **in order** in your Supabase SQL Editor.

## Migration Order

1. **`001_create_users_table.sql`** - User profiles with age validation
2. **`002_create_memories_table.sql`** - Learner profiles and cognitive tracking
3. **`003_create_sessions_table.sql`** - Voice session records
4. **`004_create_moderation_logs_table.sql`** - Safety and moderation
5. **`005_create_functions.sql`** - Helper functions (daily limit check, etc.)

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy-paste each file's contents **in order**
5. Click **Run** (or Ctrl+Enter)
6. Wait for success message before proceeding to next file

## Important Notes

- **Run in order!** Each migration depends on the previous ones
- The `users` table references `auth.users`, so Supabase Auth must be enabled (it is by default)
- Row Level Security (RLS) is enabled on all tables
- The `update_updated_at()` function is created in migration 001 and reused by others

## After Running Migrations

1. Verify tables exist: Go to **Table Editor** and check for:
   - `users`
   - `memories`
   - `sessions`
   - `moderation_logs`

2. Test the trigger: Create a test user and verify a `memories` record is auto-created

3. Test RLS: Try querying from the client without auth - should return empty

## Schema Overview

```
auth.users (Supabase built-in)
    │
    └── public.users (extended profile)
            │
            ├── public.memories (learner profile, 1:1)
            │
            └── public.sessions (tutorial sessions, 1:many)
                    │
                    └── public.moderation_logs (flags, 1:many)
```

## Troubleshooting

**Error: relation "auth.users" does not exist**
- Make sure you're running in a Supabase project (not local PostgreSQL)

**Error: function update_updated_at() does not exist**
- Run migration 001 first - it creates this shared function

**Error: type "session_status" does not exist**
- Run migration 003 before 004 - it creates the enum types

