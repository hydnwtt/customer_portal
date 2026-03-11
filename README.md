# Pilot Hub

A B2B SaaS customer portal for managing software pilots. Internal teams and customers collaborate in a shared workspace to track tasks, success metrics, and ROI — from kickoff to go/no-go decision.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) |
| Email | Resend |
| Rich Text | Tiptap |
| Deployment | Vercel |

---

## Project Structure

```
pilot-hub/
├── app/
│   ├── (admin)/admin/         # Internal team routes → /admin/*
│   │   ├── layout.tsx         # Admin shell (sidebar, no customer branding)
│   │   ├── accounts/          # Account list + detail
│   │   └── users/             # User management (INTERNAL_ADMIN only)
│   ├── (portal)/[slug]/       # Customer portal routes → /{slug}/*
│   │   ├── layout.tsx         # Portal shell (sidebar, countdown badge)
│   │   ├── welcome/           # Welcome page
│   │   ├── success-plan/      # Mutual Success Plan
│   │   ├── timeline/          # Phase timeline
│   │   ├── tasks/             # Task tracker
│   │   └── links/             # Helpful links
│   ├── api/
│   │   └── auth/[...nextauth] # Auth.js route handler
│   └── auth/
│       ├── signin/            # Sign-in page
│       └── error/             # Auth error page
├── components/
│   ├── admin/                 # Admin-specific components
│   ├── portal/                # Portal-specific components
│   └── ui/                    # Shared UI primitives
├── lib/
│   ├── auth.ts                # Auth.js config + typed helpers
│   ├── db.ts                  # Prisma client singleton
│   └── utils.ts               # cn(), dates, etc.
├── prisma/
│   ├── schema.prisma          # Full Phase 1 schema
│   └── seed.ts                # Demo data seed script (Epic 10)
├── types/
│   └── next-auth.d.ts         # Session type augmentation
└── middleware.ts              # Route protection + RBAC
```

---

## User Roles

| Role | Access |
|---|---|
| `INTERNAL_ADMIN` | Full access: all accounts, user management, hub config |
| `INTERNAL_MEMBER` | All accounts they're assigned to; no user management |
| `CUSTOMER_ADMIN` | Own account only; can edit tasks/metrics/MSP fields |
| `CUSTOMER_VIEWER` | Own account only; read-only |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally (or a hosted instance)

### 1. Clone and install

```bash
git clone <repo>
cd pilot-hub
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, etc.
```

### 3. Set up the database

```bash
# Run migrations (creates all tables)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Seed demo data
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Internal admin: navigate to `/admin/accounts`
- Customer portal: navigate to `/{account-slug}/welcome`

---

## Key Architectural Decisions

**Route groups for layout isolation**
`(admin)` and `(portal)` route groups keep layout contexts completely separate without affecting URLs. Admin routes live at `/admin/*`; customer portals at `/{slug}/*`.

**JWT sessions with embedded RBAC data**
Sessions carry `role`, `accountId`, and `accountSlug` so middleware can enforce access control without a DB lookup on every request.

**Middleware-first security**
`middleware.ts` protects all routes before any page component executes. Customers attempting to access another account's slug are redirected to their own portal.

**Audit log on every mutation**
All changes to MSP, tasks, metrics, phases, and stakeholders are written to `AuditLog` via a shared helper. Enforced at the service layer, not the UI layer.

**Blocked task escalation is synchronous**
When a task is set to `BLOCKED`, the CSM/IL email fires immediately (not queued) to prevent overnight delays.

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:seed` | Seed demo data |
