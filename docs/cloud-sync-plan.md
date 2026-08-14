# Cloud sync plan

## Goal

A learner owns the progress, not a device. The same account should continue on iPhone, PC and iPad, while multiple local learner profiles can remain separate on a shared device.

## Proposed provider

Use Supabase for the next implementation phase:

- Supabase Auth for account identity.
- Postgres for durable learner state and immutable exercise-attempt events.
- Row Level Security (RLS) so an authenticated user can only read/write their own rows.
- `@supabase/ssr` for cookie-based Next.js App Router authentication.

Do not add provider credentials to source control. Browser-safe project URL/publishable key can be configured as documented by Supabase; privileged secrets remain server-only.

## Data model

Suggested tables:

- `profiles`: account-owned learner profiles (`id`, `user_id`, `name`, onboarding/start metadata).
- `exercise_attempts`: immutable attempt events with UUID, profile, exercise, learning targets, timestamp, answer mode, correctness, mistake category, response time and hints used.
- `learner_state`: compact current materialized state per profile for fast startup.
- `sessions`: optional session summaries.
- `user_settings`: preferences that should follow the account.

Every account-owned table must include `user_id` or derive ownership through `profile_id`, with RLS policies based on the authenticated user.

## Sync strategy

1. Record each completed exercise locally with a unique attempt UUID.
2. When online and signed in, upsert missing immutable attempt events.
3. Merge by event ID, never by blindly overwriting an entire older progress JSON snapshot.
4. Recompute/update materialized learner state from the union of attempts and current SRS state.
5. Store a server revision / `updated_at` value for conflict detection.
6. Keep a local cache so a temporary connection loss does not block learning.

## Migration

Current local profile progress must not be deleted when account sync is introduced.

First sign-in flow:

1. Ask which local profile should be linked/imported.
2. Upload its local attempts/state once.
3. Mark imported records with stable IDs so a second import is idempotent.
4. Keep the local copy as cache.
5. After successful sync, server data becomes the durable source while local data remains the offline working copy.

## Current implementation status

The codebase now has a `ProgressRepository` contract and a profile-aware local repository. The adaptive learning engine must continue to depend on that abstraction rather than directly on Supabase.

Cloud authentication/database wiring is intentionally not activated until a Supabase project and environment variables are configured and the RLS schema is reviewed.
