# Supabase Setup

- Run `supabase init` if this folder is missing config.
- Run `supabase start` for local dev.
- Apply migrations with `supabase db reset` locally.
- Link a remote project with `supabase link --project-ref <ref>`.
- Push migrations with `supabase db push`.

## Generate types

```
supabase gen types typescript --local > src/supabase/types.generated.ts
```

Update `src/supabase/types.ts` to use the generated types when ready.
