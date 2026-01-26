# Sans Concept App Template

This repo is a template for bootstrapping apps with Next.js (App Router) + Supabase + a shared design system.

## Bootstrap a new app (interactive)

```
pnpm install
pnpm bootstrap
```

The bootstrap will ask for:
- app name + slug (repo name)
- domains (staging/prod)
- GitHub / Vercel / Supabase scopes
- app params (public name, support email, primary color, logo URL)
- i18n locales
- legal questionnaire
- Figma URL + token + screenshots

What it does:
- copies this template into a new folder
- writes `src/config/app.json`
- applies UI overrides (tokens + `globals.css`)
- generates legal pages in `content/legal/<locale>/`
- initializes git with `main` + `develop`
- provisions GitHub / Vercel / Supabase (if CLIs + tokens are ready)
- writes `APP_TODO.md`

## Requirements

Install CLI tools:
- `gh` (GitHub CLI)
- `vercel` (Vercel CLI)
- `supabase` (Supabase CLI)

Export tokens (local environment):
- `GITHUB_TOKEN`
- `VERCEL_TOKEN`
- `SUPABASE_ACCESS_TOKEN`
- `FIGMA_TOKEN`

After installing skills via `pnpm install:skills`, restart Codex.

## Quickstart

```
pnpm install
pnpm bootstrap
pnpm dev
```

## Environment

Copy `.env.example` to `.env` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

Use the CLI:
- `supabase start`
- `supabase db reset`
- `supabase db push`

Migrations live in `supabase/migrations/`.
Environment placeholders live in `config/supabase.*.json`.

## Legal content

Legal pages are generated into `content/legal/<locale>/` during bootstrap. The app reads Markdown from there.

## Email templates

Supabase email templates are stored in `emails/`.
Replace the logo URL and copy the HTML into the Supabase dashboard.

## Design system

Tokens live in `src/ui/tokens.json`. Base UI components live in `src/ui/`.

## i18n

Locale configuration is stored in `src/config/app.json`.
The app uses URL prefixes (e.g. `/en`). Default locale is `en`.
