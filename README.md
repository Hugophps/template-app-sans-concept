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
- design system repo URL (Git)

What it does:
- copies this template into a new folder
- writes `src/config/app.json`
- applies UI overrides (tokens + `globals.css`)
- generates legal pages in `content/legal/<locale>/`
- initializes git with `main` + `develop`
- provisions GitHub / Vercel / Supabase (if CLIs + auth are ready)
- links Vercel domains (staging + prod) if requested
- optionally connects the Vercel project to the GitHub repo
- optionally deploys preview + production to Vercel (auto domains)
- optionally sets Supabase env vars on Vercel (preview = staging, production = prod)
- writes `APP_TODO.md`

## Requirements

Install CLI tools:
- `gh` (GitHub CLI)
- `vercel` (Vercel CLI)
- `supabase` (Supabase CLI)

Auth options (choose one per service):
- GitHub: `GITHUB_TOKEN` or `gh auth login`
- Vercel: `VERCEL_TOKEN` or `vercel login`
- Supabase: `SUPABASE_ACCESS_TOKEN` or `supabase login`

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

Bootstrap can pull a design system repo (Git). It copies:
- `src/styles/theme.css` -> `src/styles/ds-theme.css`
- `src/styles/fonts.css` -> `src/styles/ds-fonts.css`
- `guidelines/` -> `docs/design-system/`
- `src/components/` -> `src/design-system/components/`

## Vercel environments

The bootstrap uses a single Vercel project. Use:
- **Preview** for staging
- **Production** for prod

## i18n

Locale configuration is stored in `src/config/app.json`.
The app uses URL prefixes (e.g. `/en`). Default locale is `en`.
