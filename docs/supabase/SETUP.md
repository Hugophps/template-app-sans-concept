# Supabase Setup

1. Install the Supabase CLI.
2. Run `supabase init` if missing config.
3. Run `supabase start` for local dev.
4. Apply migrations with `supabase db reset`.
5. Link remote: `supabase link --project-ref <ref>`.
6. Push migrations: `supabase db push`.

Keep production changes in migrations only.
