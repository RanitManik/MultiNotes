# MultiNotes

> [!NOTE]
> This repository is a personal learning project and proof-of-concept. It is not production-ready, not intended to be used to earn money, and should not be relied upon for real-world production systems. Use it for learning, experimentation, and reference only.

A multi-tenant notes application with role-based access control and subscription management.

<details>
<summary>Table of Contents</summary>

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Test Accounts](#test-accounts)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Security](#security)
- [Development](#development)
- [Development Tools](#development-tools)
- [License](#license)

</details>

## Features

- **Multi-tenant architecture** with complete data isolation
- **Role-based permissions** (Admin/Member)
- **Subscription plans** (Free: 3 notes, Pro: unlimited)
- **Rich text editor** with TipTap
- **Real-time updates** with optimistic UI
- **Dark/light theme** support
- **Comprehensive testing** (Unit, Integration, E2E)

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with React 19
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (HS256)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Jest + Playwright
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted like Supabase/Neon)
- pnpm

### Setup

1. Install dependencies:

```bash
pnpm install
```

1. Set up the database:

```bash
cd apps/web
pnpm db:migrate
pnpm db:seed
```

1. Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in `apps/web/` with:

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

# Git Hooks & Commits
pnpm commit           # Interactive commit with conventional format
```

## Development Tools

This project uses several development tools to maintain code quality:

- **EditorConfig**: Maintains consistent coding styles across editors
- **Husky**: Git hooks for pre-commit and commit-msg validation
- **lint-staged**: Run linters only on staged files
- **Commitlint**: Enforce conventional commit messages
- **Commitizen**: Interactive commit message prompts
- **Prettier**: Code formatting
- **ESLint**: Code linting

### Pre-commit Hooks

The following checks run automatically on `git commit`:

- **lint-staged**: Formats and lints staged files
- **commitlint**: Validates commit message format

### Conventional Commits

This project follows [Conventional Commits](https://conventionalcommits.org/) specification. Use:

```bash
pnpm commit
```

For interactive commit creation, or manually format as:

```text
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `revert`

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

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy

Frontend URL: [Your Vercel deployment URL]

### Manual

```bash
pnpm build
pnpm db:migrate:prod
```

## Architecture

This application uses a **shared schema with tenant_id column** approach for multi-tenancy. This means:

- All tenants share the same database schema
- Each table includes a `tenant_id` column to isolate data
- All queries include `WHERE tenant_id = $CURRENT_TENANT` filters
- Ensures complete data separation between tenants

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
