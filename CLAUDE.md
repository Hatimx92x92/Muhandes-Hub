# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `.github/copilot-instructions.md` for full architecture, patterns, and conventions — this file covers Claude-specific workflow rules only.

## Project Overview

Muhandes HUB — bilingual (AR/EN) B2B marketplace for Saudi construction. Full spec in `.docs/FEATURES.md`.

## Spec Library — READ BEFORE CODING

| File                    | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `.docs/FEATURES.md`     | Full product spec — roles, permissions, tier limits, data flows |
| `.docs/ARCHITECTURE.md` | System architecture, Supabase clients, server action pipeline   |
| `.docs/API-DESIGN.md`   | Every server action: input, auth, rate limits, steps, returns   |
| `.docs/DATABASE.sql`    | Postgres schema — tables, ENUMs, triggers, RLS, seed data       |
| `.docs/TASKS.md`        | Master task list — 371 tasks with priority/effort/status        |
| `.docs/CHECKLIST.md`    | Development checklist — granular tracking                       |
| `.docs/ROADMAP.md`      | 16-week / 11-phase plan with checklists                         |

## Task Workflow

1. Read relevant `.docs/` files before coding
2. After completing work, update **all three trackers**:
   - `.docs/TASKS.md` — mark `[ ]` → `[x]`
   - `.docs/CHECKLIST.md` — mark `[ ]` → `[x]`
   - `.docs/ROADMAP.md` — mark `[ ]` → `[x]`

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint 9 flat config
npm run test         # Vitest (watch)
npm run test:run     # Vitest (single run)
```

## Testing & User Creation

- **Creating users**: Always use the browser registration page (`/register`) — never scripts or direct DB inserts
- **Demo accounts**: `.docs/DEMO-USERS.md`
- **E2E test plan**: `.docs/TESTS.md` (214 tests, 10 phases)

## Key Rules

- **Frontend consistency**: When changing any UI, ensure the entire app stays consistent — follow `.github/copilot-instructions.md` "Frontend Consistency Rules"
- **RTL**: Always use logical properties (`ps-`/`pe-`/`ms-`/`me-`/`start`/`end`) — never `pl-`/`pr-`/`left`/`right`
- **Server Actions**: 7-step pipeline — Auth → Rate limit → Zod → Role → Tier → DB → Side effects
- **Zod v4**: `import { z } from 'zod/v4'` — not `from 'zod'`
- **i18n**: `next-intl` with `useTranslations()` client / `getTranslations()` server
- **Supabase admin client**: Only in `src/actions/admin/`

## Agent Self-Service Rule

Before asking questions, read `.docs/FEATURES.md`. Propose answers from the spec — only ask the user to confirm.

## After Completing a Task

Report affected files:

- **New** — created from scratch
- **Modified** — edited

Do not create markdown summary files after tasks.
