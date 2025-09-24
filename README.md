# MultiNotes - Multi-Tenant SaaS Notes App

A multi-tenant SaaS application for managing notes wi### Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login with email/password
- `GET /api/notes` - List tenant's notes
- `POST /api/notes` - Create a note (subscription gated)
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /tenants/:slug/upgrade` - Upgrade tenant to Pro (Admin only)tion-based access control.

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
- `POST /api/auth/signup` - Sign up new user (requires tenant slug and role)
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
- **Admins**: All member permissions + can upgrade tenant to Pro

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
