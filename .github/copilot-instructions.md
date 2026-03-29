# Muhandes HUB — Copilot Instructions

Bilingual (Arabic/English) B2B marketplace for the Saudi construction industry. Multi-role platform with subscription tiers, deal workspaces, bidding/quotation, and admin moderation.

## Spec Library — READ BEFORE CODING

**Always consult `.docs/` before asking the user questions** — propose answers derived from the spec:

| File                    | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `.docs/FEATURES.md`     | Full product spec — roles §2.1, permissions, tier limits §2.2, data flows |
| `.docs/ARCHITECTURE.md` | System architecture, Supabase clients, server action pipeline             |
| `.docs/API-DESIGN.md`   | Every server action: input, auth, rate limits, steps, returns             |
| `.docs/DATABASE.sql`    | Complete Postgres schema — tables, ENUMs, triggers, RLS, seed data        |
| `.docs/TASKS.md`        | **Master task list** — 371 numbered tasks with priority/effort/status     |
| `.docs/CHECKLIST.md`    | Development checklist — granular task tracking per sub-section            |
| `.docs/ROADMAP.md`      | 16-week / 11-phase implementation plan with phase-level checklists        |
| `.docs/USER-FLOWS.md`   | User journey flows for all roles                                          |

## Task Workflow

After completing work, update **all three trackers**:

- `.docs/TASKS.md` — mark `[ ]` → `[x]` for completed task rows
- `.docs/CHECKLIST.md` — check off `[ ]` → `[x]` for completed items
- `.docs/ROADMAP.md` — check off `[ ]` → `[x]` for completed tasks

## Build & Test

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint 9 flat config
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
npm run typesense:index  # Reindex Typesense
```

## Testing & User Creation

- **Creating users**: Always use the browser registration page (`/register`) via browser tools — never create users via scripts or direct DB inserts
- **Demo accounts**: See `.docs/DEMO-USERS.md` for existing test accounts with credentials
- **E2E test plan**: See `.docs/TESTS.md` for the full 214-test plan across 10 phases
- **Cron jobs**: 3 daily jobs (subscription/commission/reminder checks) — see `vercel.json`

## Architecture

- **Next.js 16** App Router · **React 19** · **TypeScript strict** (`@/*` → `./src/*`)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — design tokens in `src/app/globals.css` as `@theme inline`
- **Supabase** (Postgres + Auth + Storage + Realtime) — no custom server
- **i18n**: `next-intl` with locale prefix routing (`/ar/...`, `/en/...`), default `ar`
- **Server Components by default** — `'use client'` only for interactivity/hooks/browser APIs
- **Mutations via Server Actions** in `src/actions/` — API routes only for webhooks

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

## Frontend Consistency Rules

**When changing any frontend code, ensure the entire app stays consistent:**

1. **Design tokens only** — use CSS variables from `globals.css` (`--primary`, `--secondary`, `--muted`, `--destructive`, etc.). Never hardcode colors
2. **UI primitives first** — use existing `src/components/ui/` components (Button, Input, Card, Modal, Badge, Tabs, Skeleton, Toast). Don't create ad-hoc styled elements
3. **Variant system** — buttons use `variant` + `size` props (`primary`/`secondary`/`outline`/`ghost`/`destructive`/`link` × `sm`/`md`/`lg`/`icon`). Follow this pattern for new components
4. **RTL via logical properties** — always `ps-`/`pe-`/`ms-`/`me-`/`start`/`end`. **Never** `pl-`/`pr-`/`ml-`/`mr-`/`left`/`right`
5. **`cn()` for classes** — always compose via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
6. **Spacing scale** — consistent spacing: `gap-3`/`gap-4`/`gap-6` for layout, `p-4`/`p-6` for cards, `space-y-4`/`space-y-6` for stacked content
7. **Border radius** — use token-based: `rounded-lg` (cards), `rounded-xl` (large cards/modals), `rounded-md` (inputs/buttons)
8. **Dark mode** — use semantic classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`). Custom variant: `dark:` via `.dark` class
9. **Animations** — use `framer-motion` with components from `src/components/ui/motion.tsx` (`ScrollReveal`, `StaggeredList`). Standard transitions: `duration-200 ease-out`
10. **Empty states** — use `EmptyState` from `src/components/features/empty-state.tsx` for all empty lists/sections
11. **Loading states** — use `Skeleton` component for loading placeholders. Each page has `loading.tsx`
12. **Icons** — `lucide-react` only. Size `h-4 w-4` (inline), `h-5 w-5` (buttons), `h-8 w-8`+ (feature icons)

### Component Conventions

```
src/components/
├── ui/          # Primitives: Button, Input, Card, Modal, Badge, etc. (named exports, forwardRef for inputs)
├── forms/       # Form components with Zod integration (bid-form, rfq-form, register-wizard, etc.)
├── layout/      # Header, Footer, Sidebar, Topbar, MobileNav, LocaleSwitcher
└── features/    # Domain composites grouped by folder (deals/, crm/, kanban/, messaging/, etc.)
```

- **Named exports** for reusable components; **default exports** for `page.tsx`/`layout.tsx`
- **`forwardRef`** for all form input components + set `displayName`
- **Feature components** go in `features/{domain}/`. Standalone cross-cutting features go directly in `features/`

### i18n Pattern

- All user-facing text via `next-intl`: `useTranslations('namespace')` in client, `getTranslations('namespace')` in server
- Messages in `messages/ar.json` and `messages/en.json` — nested by namespace
- DB fields: paired `title_ar`/`title_en`, `description_ar`/`description_en`
- Use `getLocaleField(record, 'title', locale)` from `@/lib/utils` for DB records

## Server Action Pattern

All mutations follow a 7-step security pipeline (see `.docs/ARCHITECTURE.md`):

```
1) Auth → 2) Rate limit → 3) Zod validate → 4) Role check → 5) Tier limit → 6) DB op → 7) Side effects
```

Return type: `ActionResult<T>` from `@/types` — always `{ data, error }` with optional `fieldErrors`.

Schemas in `src/schemas/` — shared between client forms and server actions. Uses **Zod v4** (`import { z } from 'zod/v4'`).

## Immutable Business Rules

DB-enforced via triggers + RLS — never violate in application code:

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

## Security

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to client
- **RLS on all tables** — never bypass except in `src/actions/admin/`
- **File uploads** — max 10 MB documents, 5 MB images. Validate MIME server-side
- **Rate limiting** via `@upstash/ratelimit` — see `src/lib/rate-limit.ts`
- **Security headers** configured in `next.config.ts` (HSTS, X-Frame-Options, CSP)

## Permission & Tier Reference

Check `.docs/FEATURES.md` §2.1 for the full role permission matrix and §2.2/§4.3 for tier limits before implementing any gated feature.

## Agent Self-Service Rule

**Before asking the user a question**, read `.docs/FEATURES.md`. The spec covers roles, permissions, tier limits, data flows, page structure, notification types, coupon rules, and commission workflows. Propose an answer derived from the spec — only ask the user to confirm or override.
