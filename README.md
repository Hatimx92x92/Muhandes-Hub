# Muhandes HUB

Bilingual (Arabic/English) B2B marketplace for the Saudi construction industry. Multi-role platform with subscription tiers, deal workspaces, bidding/quotation systems, and admin moderation.

## Tech Stack

- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Search**: Typesense (Arabic + English, typo tolerance)
- **Payments**: Moyasar (Visa/MC 3D Secure, bank transfer)
- **Email**: Resend · **Messaging**: Twilio WhatsApp
- **Hosting**: Vercel

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (or local via `supabase start`)
- Typesense server (optional — falls back to PostgreSQL search)

## Setup

1. **Clone & install**

```bash
git clone <repo-url>
cd muqawilhub
npm install
```

2. **Environment variables**

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable                              | Scope       | Description                                  |
| ------------------------------------- | ----------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | Public      | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Public      | Supabase anonymous key                       |
| `SUPABASE_SERVICE_ROLE_KEY`           | Server-only | Supabase service role key (admin operations) |
| `NEXT_PUBLIC_APP_URL`                 | Public      | App URL (`http://localhost:3000` in dev)     |
| `NEXT_PUBLIC_APP_NAME`                | Public      | `Muhandes HUB`                               |
| `RESEND_API_KEY`                      | Server-only | Resend API key for transactional email       |
| `UPSTASH_REDIS_REST_URL`              | Server-only | Upstash Redis URL (rate limiting)            |
| `UPSTASH_REDIS_REST_TOKEN`            | Server-only | Upstash Redis token                          |
| `TYPESENSE_HOST`                      | Server-only | Typesense server host                        |
| `TYPESENSE_API_KEY`                   | Server-only | Typesense admin API key                      |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`    | Public      | Typesense search-only key                    |
| `MOYASAR_SECRET_KEY`                  | Server-only | Moyasar secret key                           |
| `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` | Public      | Moyasar publishable key                      |

3. **Database setup**

Run the schema from `.docs/DATABASE.sql` against your Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or paste the SQL into the Supabase SQL Editor
```

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint check
```

## Project Structure

```
src/
├── app/                  # App Router pages & API routes
│   ├── (public)/         # Public pages (marketplace, pricing, etc.)
│   ├── (auth)/           # Auth pages (login, register, forgot-password)
│   ├── (dashboard)/      # Role-gated dashboard pages
│   ├── (admin)/          # Admin panel (is_admin guard)
│   └── api/              # Webhooks & health endpoint
├── actions/              # Server Actions (mutations)
├── components/           # Shared UI components
│   ├── ui/               # Primitives (Button, Input, Card, Modal, etc.)
│   ├── forms/            # Form components with Zod integration
│   ├── layout/           # Header, Footer, Sidebar, Topbar
│   └── features/         # Domain-specific composites
├── hooks/                # Client-side React hooks
├── lib/                  # Core utilities (Supabase clients, etc.)
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
└── middleware.ts          # Auth, locale, route protection
```

## User Roles

| Role            | Description                               |
| --------------- | ----------------------------------------- |
| `project_owner` | Posts construction projects, awards bids  |
| `contractor`    | Bids on projects, manages Kanban pipeline |
| `supplier`      | Lists products, responds to RFQs          |
| `buyer`         | Purchases products, posts RFQs            |

Roles are set at registration and cannot be changed.

## Subscription Tiers

| Feature     | Starter | Pro     | Business  | Enterprise |
| ----------- | ------- | ------- | --------- | ---------- |
| Commission  | 2%      | 1%      | 0%        | 0%         |
| Bids/month  | 10      | 50      | 100       | Unlimited  |
| Products    | 2       | 10      | 50        | Unlimited  |
| CRM clients | 20      | 200     | Unlimited | Unlimited  |
| Analytics   | —       | Summary | Full      | Full       |

## Admin Setup

To make a user an admin, run this SQL in Supabase:

```sql
UPDATE profiles SET is_admin = true WHERE id = '<user-uuid>';
```

Admin panel is accessible at `/admin` and requires `is_admin = true`.

## Deployment (Vercel)

1. Connect your repository to Vercel
2. Set all environment variables in the Vercel dashboard
3. Deploy — Vercel auto-detects Next.js

Health check endpoint: `GET /api/health`

## Documentation

See the `.docs/` folder for full specifications:

- `FEATURES.md` — Product spec, roles, permissions, tier limits
- `ARCHITECTURE.md` — System architecture, Supabase patterns
- `API-DESIGN.md` — Server action specs
- `DATABASE.sql` — Complete Postgres schema
- `ROADMAP.md` — Implementation roadmap
- `TASKS.md` — Master task list
