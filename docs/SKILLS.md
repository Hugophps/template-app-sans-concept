# Skills

This template relies on external Codex skills. These are installed to the user's global Codex directory
(not inside this repo), so we keep a lockfile + install script here for reproducibility.

Note: In this template, the app `slug` is used as the repo name.

## Install

Run from repo root:

```
pnpm install
pnpm install:skills
```

Notes:
- Uses `CODEX_HOME` if set, otherwise `~/.codex`.
- Requires `python3` and (for one skill) `git`.
- Restart Codex after install so new skills are picked up.
- If you previously installed the Vercel React skill under a different folder name\n+  (e.g. `react-best-practices`), you can delete the old folder to avoid duplicates.

## Locked skills

See `skills.lock.json` for the exact sources (repo/path/ref).

Current set:
- vercel-react-best-practices (from vercel-labs/agent-skills)
- web-design-guidelines (from vercel-labs/agent-skills)
- nextjs-app-router-fundamentals (from wsimmonds/claude-nextjs-skills)
- supabase (from alinaqi/claude-bootstrap)
- supabase-reference-architecture (from jeremylongshore/claude-code-plugins-plus-skills)
- design-system-starter (from ArieGoldkin/ai-agent-hub)

## Why not in-repo?

Codex loads skills from its global directory. This repo only provides:
- a reproducible list of skill sources (`skills.lock.json`)
- an install script (`scripts/install-skills.mjs`)

This keeps the template clean while ensuring the exact same skills can be installed on demand.
