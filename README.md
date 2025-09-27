# MultiNotes

A multi-tenant SaaS notes application with role-based access control and subscription management.

## Features

- **Multi-tenant architecture** with complete data isolation
- **Role-based permissions** (Admin/Member)
- **Subscription plans** (Free: 3 notes, Pro: unlimited)
- **Rich text editor** with TipTap
- **Real-time updates** with optimistic UI
- **Dark/light theme** support
- **Comprehensive testing** (Unit, Integration, E2E)

## Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT with bcrypt
- **UI**: Tailwind CSS + shadcn/ui
- **Testing**: Jest + Playwright
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Setup database
cd apps/web
pnpm db:migrate
pnpm db:seed

# Start development server
pnpm dev
```

Visit `http://localhost:3000`

## Environment Variables

Create `.env.local` in `apps/web/`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/multinotes"
JWT_SECRET="your-super-secret-jwt-key-here"
```

## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run linting
pnpm test             # Run all tests

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:generate      # Generate Prisma client
```

## Test Accounts

All accounts use password: `password`

**Acme Tenant:**

- `admin@acme.test` (Admin)
- `user@acme.test` (Member)

**Globex Tenant:**

- `admin@globex.test` (Admin)
- `user@globex.test` (Member)

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/invite` - Invite user (Admin only)
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/tenants/:slug/upgrade` - Upgrade to Pro (Admin only)

## Deployment

### Vercel

1. Connect GitHub repo to Vercel
2. Set `DATABASE_URL` and `JWT_SECRET` env vars
3. Deploy

### Manual

```bash
pnpm build
pnpm db:migrate:prod
```

## License

MIT

## Architecture

This application uses a **shared schema with tenant_id column** approach for multi-tenancy. This means:

- All tenants share the same database schema
- Each table includes a `tenant_id` column to isolate data
- All queries include `WHERE tenant_id = $CURRENT_TENANT` filters
- Ensures complete data separation between tenants

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with React 19
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (HS256)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted like Supabase/Neon)

### Environment Variables

Create a `.env.local` file in `apps/web/` with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/multinotes"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up the database:

```bash
cd apps/web
npx prisma migrate dev --name init
npx prisma db seed
```

3. Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy

Frontend URL: [Your Vercel deployment URL]

## Test Accounts

All accounts use password: `password`

- **Acme Tenant**:
  - admin@acme.test (Admin)
  - user@acme.test (Member)

- **Globex Tenant**:
  - admin@globex.test (Admin)
  - user@globex.test (Member)

## API Documentation

### Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

### Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/invite` - Invite new user to tenant (Admin only)
- `GET /api/notes` - List tenant's notes
- `POST /api/notes` - Create a note (subscription gated)
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro (Admin only)

### Subscription Gating

- Free plan: Maximum 3 notes per tenant
- Pro plan: Unlimited notes
- Only Admins can upgrade their tenant

### Role-based Access

- **Members**: Can CRUD notes within their tenant
- **Admins**: All member permissions + can invite users and upgrade tenant to Pro

## Security

- JWT tokens expire in 24 hours
- All database queries filtered by tenant_id
- Passwords hashed with bcrypt
- CORS configured for cross-origin requests

## Development

### Running Tests

```bash
# Run automated tests (when available)
pnpm test
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration-name

# Reset database
npx prisma migrate reset
```

## License

MIT
