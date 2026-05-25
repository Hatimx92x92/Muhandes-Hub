# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Muhandes HUB — bilingual (AR/EN) B2B marketplace for the Saudi construction industry. Multi-role platform with subscription tiers, deal workspaces, bidding/quotation, and admin moderation.

## Spec Library — READ BEFORE CODING

**Always consult `.docs/` before asking the user questions** — propose answers derived from the spec:

| File                    | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `.docs/FEATURES.md`     | Full product spec — roles §2.1, permissions, tier limits §2.2, data flows |
| `.docs/ARCHITECTURE.md` | System architecture, Supabase clients, server action pipeline             |
| `.docs/API-DESIGN.md`   | Every server action: input, auth, rate limits, steps, returns             |
| `.docs/DATABASE.sql`    | Complete Postgres schema — tables, ENUMs, triggers, RLS, seed data        |
| `.docs/TASKS.md`        | Master task list — 371 numbered tasks with priority/effort/status         |
| `.docs/CHECKLIST.md`    | Development checklist — granular task tracking per sub-section            |
| `.docs/ROADMAP.md`      | 16-week / 11-phase implementation plan with phase-level checklists        |
| `.docs/USER-FLOWS.md`   | User journey flows for all roles                                          |
| `.docs/DEMO-USERS.md`   | Test account credentials for manual testing                               |
| `.docs/TESTS.md`        | Full 214-test E2E plan across 10 phases                                   |
| `.docs/PRD.md`          | Product requirements document                                             |

## Commands

```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm run lint             # ESLint 9 flat config
npm run test             # Vitest (watch mode)
npm run test:run         # Vitest (single run)
npm run typesense:index  # Reindex Typesense (required after schema/data changes)

# Run a single test file
npx vitest run src/__tests__/path/to/test.ts
```

## Infrastructure Access

### Supabase (via MCP)

Two Supabase projects configured in `.vscode/mcp.json`:

| Server ID       | Environment    | Purpose                                      |
| --------------- | -------------- | -------------------------------------------- |
| `supabase`      | **Local**      | Development DB — safe for experiments        |
| `supabase-prod` | **Production** | Live DB — **confirm before destructive ops** |

Use `mcp_supabase_*` tools to query, migrate, and manage both. Always specify which project when running SQL.

### Vercel (via CLI)

Logged in as `muqawilhub-2131`. Use `npx vercel` commands for deployments, env vars, logs.

- `npx vercel ls` — list deployments
- `npx vercel env ls` — list env vars
- `npx vercel logs <url>` — view deployment logs
- `npx vercel --prod` — deploy to production (⚠️ confirm first)

### Environment Variables

Template in `.env.example`. Required services: Supabase, Resend, Upstash Redis, Typesense, Moyasar.

## Architecture

- **Next.js 16** App Router · **React 19** · **TypeScript strict** (`@/*` → `./src/*`)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — design tokens in `src/app/globals.css` as `@theme inline`
- **Supabase** (Postgres + Auth + Storage + Realtime) — no custom server
- **i18n**: `next-intl` with locale prefix routing (`/ar/...`, `/en/...`), default `ar`
- **Server Components by default** — `'use client'` only for interactivity/hooks/browser APIs
- **Mutations via Server Actions** in `src/actions/` — API routes only for webhooks/cron

### Route Groups

| Group         | Path                                               | Purpose                                                                   |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| `(public)`    | `/[locale]/...`                                    | Unauthenticated: pricing, marketplace, projects, partners, contact, legal |
| `(auth)`      | `/[locale]/login`, `/register`, `/forgot-password` | Auth pages — redirect if logged in                                        |
| `(dashboard)` | `/[locale]/dashboard/...`                          | Role-gated — requires auth + verification gates                           |
| `(admin)`     | `/[locale]/admin/...`                              | Admin panel — requires `is_admin` flag                                    |
| `api/`        | `/api/...`                                         | Webhooks (Moyasar, Typesense, cron)                                       |

### Supabase Clients

| File                         | Context                       | Rule                                 |
| ---------------------------- | ----------------------------- | ------------------------------------ |
| `lib/supabase/client.ts`     | Client components             | Browser client with RLS              |
| `lib/supabase/server.ts`     | Server components & actions   | Uses `cookies()` from `next/headers` |
| `lib/supabase/admin.ts`      | `src/actions/admin/` **only** | Service role — bypasses RLS ⚠️       |
| `lib/supabase/middleware.ts` | `src/middleware.ts` only      | Session + cookie refresh             |

### Middleware Flow

`next-intl` locale extraction runs first. Then three protection layers:

1. **Dashboard routes** — require auth + `verification_status === 'active'` (redirects to `/verify/*` gates)
2. **Admin routes** — require auth + `is_admin` flag
3. **Session enforcement** — single-device via `mh_session_token` cookie vs `profiles.active_session_token`

Verification status flow: `pending_email` → `pending_payment` (Pro+ only) → `pending_documents` → `pending_approval` → `active`

## Key Rules

- **RTL**: Always use logical properties (`ps-`/`pe-`/`ms-`/`me-`/`start`/`end`) — never `pl-`/`pr-`/`left`/`right`
- **Server Actions**: 7-step pipeline — Auth → Rate limit → Zod → Role → Tier → DB → Side effects
- **Zod v4**: `import { z } from 'zod/v4'` — not `from 'zod'`
- **i18n**: `useTranslations('namespace')` client / `getTranslations('namespace')` server. Messages in `messages/ar.json` and `messages/en.json` — nested by namespace. DB fields: `title_ar`/`title_en` — use `getLocaleField(record, 'title', locale)` from `@/lib/utils`
- **Enums**: All app enums are in `src/types/enums.ts` as `const` objects (not TypeScript `enum`). Always import from `@/types` (re-exported via `src/types/index.ts`)
- **Free roles**: `project_owner` and `buyer` skip subscription gating entirely — use `isFreeRole(role)` or `getEffectiveLimits(role, tier)` from `@/types` instead of checking tier directly
- **Supabase admin client**: Only in `src/actions/admin/`
- **Design tokens only**: Use CSS variables (`--primary`, `--muted`, etc.) — never hardcode colors
- **`cn()` for classes**: Always compose via `cn()` from `@/lib/utils` (clsx + tailwind-merge)

## Frontend Consistency Rules

**When changing any frontend code, ensure the entire app stays consistent:**

1. **Design tokens only** — use CSS variables from `globals.css` (`--primary`, `--secondary`, `--muted`, `--destructive`, etc.). Never hardcode colors
2. **UI primitives first** — use existing `src/components/ui/` components (Button, Input, Card, Modal, Badge, Tabs, Skeleton, Toast). Don't create ad-hoc styled elements
3. **Variant system** — buttons use `variant` + `size` props (`primary`/`secondary`/`outline`/`ghost`/`destructive`/`link` × `sm`/`md`/`lg`/`icon`). Follow this pattern for new components
4. **RTL via logical properties** — always `ps-`/`pe-`/`ms-`/`me-`/`start`/`end`. **Never** `pl-`/`pr-`/`ml-`/`mr-`/`left`/`right`
5. **`cn()` for classes** — always compose via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
6. **Spacing scale** — consistent spacing: `gap-3`/`gap-4`/`gap-6` for layout, `p-4`/`p-6` for cards, `space-y-4`/`space-y-6` for stacked content
7. **Border radius** — token-based: `rounded-lg` (cards), `rounded-xl` (large cards/modals), `rounded-md` (inputs/buttons)
8. **Dark mode** — use semantic classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`). Custom variant: `dark:` via `.dark` class
9. **Animations** — use `framer-motion` with components from `src/components/ui/motion.tsx` (`ScrollReveal`, `StaggeredList`). Standard transitions: `duration-200 ease-out`
10. **Empty states** — use `EmptyState` from `src/components/features/empty-state.tsx` for all empty lists/sections
11. **Loading states** — use `Skeleton` component for loading placeholders. Each page has `loading.tsx`
12. **Icons** — `lucide-react` only. Size `h-4 w-4` (inline), `h-5 w-5` (buttons), `h-8 w-8`+ (feature icons)

### Component Conventions

```
src/components/
├── ui/          # Primitives: Button, Input, Card, Modal, Badge, etc.
├── forms/       # Form components with Zod integration
├── layout/      # Header, Footer, Sidebar, Topbar, MobileNav
└── features/    # Domain composites grouped by folder (deals/, crm/, notifications/, etc.)
```

- **Named exports** for reusable components; **default exports** for `page.tsx`/`layout.tsx`
- **`forwardRef`** for all form input components + set `displayName`
- **Feature components** go in `features/{domain}/`. Standalone cross-cutting features go directly in `features/`

## Server Action Pattern

All mutations follow a 7-step security pipeline:

```
1) Auth → 2) Rate limit → 3) Zod validate → 4) Role check → 5) Tier limit → 6) DB op → 7) Side effects
```

Return types from `@/types`:
- Mutations: `ActionResult<T>` — always `{ data, error }` with optional `fieldErrors`
- List queries: `PaginatedResult<T>` — `{ data, totalCount, page, perPage, totalPages }`
- Pagination input: `PaginationParams` — `{ page?, perPage?, search?, sort?, ...filters }`

Schemas in `src/schemas/` — shared between client forms and server actions. Uses **Zod v4** (`import { z } from 'zod/v4'`).

## Key Utilities

**`@/lib/utils`**

| Function                                                        | Purpose                                        |
| --------------------------------------------------------------- | ---------------------------------------------- |
| `cn()`                                                          | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatSAR(amount, locale?)`                                    | Saudi Riyal formatting                         |
| `formatPhone(phone)`                                            | Format +966 phone numbers                      |
| `getLocaleField(record, field, locale)`                         | Extract bilingual DB field with fallback       |
| `calculateVAT(net)`, `netToGross(net)`, `grossToNet(gross)`     | VAT 15% (ZATCA) — all prices are gross         |
| `slugify(text)`                                                 | URL-safe slug (Unicode-aware for Arabic)       |
| `generateUniqueSlug(text, table, column, supabase)`             | DB collision-safe slug                         |
| `formatDate(date, locale)`, `formatRelativeTime(date, locale)`  | Locale-aware dates                             |

**`@/types`** (subscription/role helpers)

| Function / Constant              | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `getEffectiveLimits(role, tier)` | Returns `TierLimits` — free roles always get `FREE_ROLE_LIMITS`        |
| `isFreeRole(role)`               | `true` for `project_owner` / `buyer` — skip tier gates for these roles |
| `TIER_LIMITS`                    | Map of tier → `TierLimits` (starter/pro/business/enterprise)           |
| `SUBSCRIPTION_PRICING`           | Monthly SAR prices per tier                                             |
| `DURATION_DISCOUNTS`             | Duration discount percentages (1/3/6/12 months)                        |

**`@/lib/auth-guards`**

| Function                        | Purpose                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `requireRole(allowedRoles[])`   | Server page guard — fetches user + profile, redirects if role not in allowed list   |

## Immutable Business Rules (DB-enforced)

Never violate these in application code — enforced via triggers + RLS:

1. **Roles immutable** — one per account, set at registration
2. **Deals** — created only on bid award or quotation acceptance
3. **Posts require admin approval** — `Draft → Pending → Published`
4. **Subscription limits** — double-enforced: client (hide UI) + server (reject in action)
5. **`is_admin`** — only settable via service role key
6. **Reviews** — only after deal `completed`, one per direction, 30-day window, 48h edit
7. **Commission** — Starter 2%, Pro 1%, Business/Enterprise 0%

## Bilingual & Saudi Patterns

- Tailwind logical properties for RTL — never physical `left`/`right`
- SAR currency: `formatSAR()` from `@/lib/utils`
- Phone: `+966` validation (Zod regex `^[0-9]{9}$` for the 9 digits)
- ZATCA VAT 15%: `calculateVAT()`, `netToGross()`, `grossToNet()` from `@/lib/utils`
- PDPL consent banner on every page via `PDPLConsentBanner` in locale layout
- All prices are **gross** (VAT-included) per ZATCA requirements

## Security

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to client
- **RLS on all tables** — never bypass except in `src/actions/admin/`
- **File uploads** — max 10 MB documents, 5 MB images. Validate MIME server-side
- **Rate limiting** via `@upstash/ratelimit` — see `src/lib/rate-limit.ts`
- **Security headers** configured in `next.config.ts` (HSTS, X-Frame-Options, CSP)

## Database & Schema Management

- **TypeScript Types**: `src/types/database.ts` is **manually maintained** — NOT auto-generated. Update `Tables<>`, `TablesInsert<>`, `TablesUpdate<>` types when schema changes. `mcp_supabase_generate_typescript_types` exists but manual edits are preferred for accuracy
- **Migrations**: Hand-written SQL in `.docs/migrations/` — **always apply them yourself** via MCP or CLI (never leave them for the user to apply manually)
- **Typesense Sync**: Manual only — `npm run typesense:index` required after schema/data changes. No real-time webhook. AR+EN fields indexed separately per language
- **Check advisors** regularly: `mcp_supabase_get_advisors` after DDL changes

### Applying Migrations — Required Steps

Always apply migrations yourself as part of any DB schema change. Use whichever method is available:

**Method 1 — MCP (preferred):**
```
mcp_supabase_apply_migration(name, query)   ← apply named migration
mcp_supabase_execute_sql(query)             ← run raw SQL
```
The MCP server is in `.vscode/mcp.json`. If tools fail with auth errors, the access token is expired — ask the user to regenerate it at https://supabase.com/dashboard/account/tokens and update `.vscode/mcp.json`.

**Method 2 — Supabase CLI:**
```bash
# Requires a valid SUPABASE_ACCESS_TOKEN and the DB password
SUPABASE_ACCESS_TOKEN=<token> npx supabase link --project-ref eboagsdzuawcmkerxoof
npx supabase db execute --file .docs/migrations/<file>.sql
```

**Method 3 — Direct psql (fallback):**
```bash
# Use POSTGRES_URL from Vercel env vars (npx vercel env pull)
psql "$POSTGRES_URL" -f .docs/migrations/<file>.sql
```

**If all methods fail** (expired token, no Docker, no DB password): apply the migration via the Supabase SQL editor at https://supabase.com/dashboard/project/eboagsdzuawcmkerxoof/sql and tell the user that the token needs refreshing.

### Keeping MCP Working

The Supabase personal access token in `.vscode/mcp.json` expires. When MCP tools fail with "Unauthorized":
1. User generates a new token at https://supabase.com/dashboard/account/tokens
2. User updates `.vscode/mcp.json` → replace `--access-token` value
3. Restart Claude Code / reload the MCP server

## Testing & User Creation

- **Creating users**: Always use the browser registration page (`/register`) — never scripts or direct DB inserts
- **Demo accounts**: `.docs/DEMO-USERS.md`
- **Unit tests only**: No DB fixtures, no integration tests, no E2E framework
- **Pattern**: Zod schema validation via `.safeParse()` only
- **Structure**: `src/__tests__/{domain}/*.test.ts`
- **E2E Plan**: Manual testing checklist in `.docs/TESTS.md` (214 tests, 10 phases)

## Rate Limiting

Pre-configured limits in `src/lib/rate-limit.ts`. Always check for rate limit hits when debugging failed requests.

| Endpoint      | Limit          | Purpose         |
| ------------- | -------------- | --------------- |
| Login         | 5 / 15 minutes | Brute force     |
| Register      | 3 / hour       | Account spam    |
| Bids          | 20 / hour      | API abuse       |
| Messages      | 60 / minute    | Chat spam       |
| Search        | 120 / minute   | Query spam      |
| API (general) | 200 / minute   | Global throttle |

## Cron & Automation

- **Single daily cron**: `/api/cron/daily` at `0 20 * * *` (8 PM UTC / 11 PM Saudi)
- **3 sub-jobs**: subscription checks · commission overdue notices · CRM follow-up reminders
- **Security**: Requires `Authorization: Bearer {CRON_SECRET}` header validation
- **NOT run on deploy** — verify separately in Vercel logs

## Task Workflow

After completing work, update **all three trackers**:

- `.docs/TASKS.md` — mark `[ ]` → `[x]`
- `.docs/CHECKLIST.md` — mark `[ ]` → `[x]`
- `.docs/ROADMAP.md` — mark `[ ]` → `[x]`

## Post-Deploy Steps (Manual)

These are **NOT automated** on Vercel deploy:

1. Run migrations: `mcp_supabase_apply_migration`
2. Reindex Typesense: `npm run typesense:index`
3. Verify cron: Check Vercel logs for `/api/cron/daily`

## Gotchas

- **Locale prefix stripping**: Middleware strips `/ar/` or `/en/` before route matching
- **PKCE cookie loss**: Google OAuth can fail if PKCE cookie lost — middleware auto-detects this
- **Google OAuth incomplete**: Users signing up via Google redirect to `/register?oauth=google` to complete profile
- **Single-device sessions**: New login invalidates previous session token — middleware forces sign-out on mismatch
- **Bilingual field fallback**: Always handle empty `{field}_ar` or `{field}_en` — production data may have gaps
- **Typesense stale**: `npm run typesense:index` required after any data/schema change
- **No E2E framework**: Tests are unit-only; E2E testing is manual via `.docs/TESTS.md`
- **Cron not on deploy**: Scheduled jobs must be verified separately; not part of build pipeline

## Shortcuts

| Trigger word | Action                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| `deploy`     | Run `npx vercel --prod` to deploy to production — no confirmation needed |

## Agent Self-Service Rule

Before asking questions, read `.docs/FEATURES.md`. The spec covers roles, permissions, tier limits, data flows, page structure, notification types, coupon rules, and commission workflows. Propose an answer derived from the spec — only ask the user to confirm or override.

## Titles Over IDs Rule

**Never display raw UUIDs, database IDs, or bare slugs as visible text in the UI.** Always resolve and show a human-readable title instead.

- Deals have no `title_ar`/`title_en` — always join `projects(title_ar, title_en)` and display the project title
- Use the fallback chain: `getLocaleField(joined_project, 'title', locale)` → `getLocaleField(deal, 'title', locale)` → `sourceInfo?.label` → `t('dealPrefix') + ' #' + id.slice(0, 8)`
- Breadcrumbs, page headers, list rows, and notifications must all resolve titles this way
- For any entity that lacks bilingual title columns, join its parent/source entity and use that title

## Browser Testing Rule

**Whenever working on any existing or new feature, use the Playwright browser tool to test it on the production site before reporting the task as complete.**

- Navigate to the relevant production URL and exercise the feature's golden path
- Check edge cases and verify no regressions in adjacent features
- If the production site is unreachable, test on the local dev server (`npm run dev`) and state that explicitly

## After Completing a Task

Report affected files:

- **New** — created from scratch
- **Modified** — edited

Do not create markdown summary files after tasks.
