import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../app/api/tenants/[slug]/upgrade/route';

// Mock auth
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  createToken: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { requireAuth, createToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

describe('Tenant Upgrade API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated user', async () => {
    (requireAuth as jest.Mock).mockReturnValue(null);

    await testApiHandler({
      appHandler,
      params: { slug: 'test-tenant' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Unauthorized');
      },
    });
  });

  it('should return 403 for non-admin user', async () => {
    (requireAuth as jest.Mock).mockReturnValue({
      id: 1,
      role: 'member',
      tenantSlug: 'test-tenant',
    });

    await testApiHandler({
      appHandler,
      params: { slug: 'test-tenant' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toBe('Admin access required');
      },
    });
  });

  it('should return 403 for tenant mismatch', async () => {
    (requireAuth as jest.Mock).mockReturnValue({
      id: 1,
      role: 'admin',
      tenantSlug: 'other-tenant',
    });

    await testApiHandler({
      appHandler,
      params: { slug: 'test-tenant' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toBe('Tenant mismatch');
      },
    });
  });

  it('should return 404 for tenant not found', async () => {
    (requireAuth as jest.Mock).mockReturnValue({
      id: 1,
      role: 'admin',
      tenantSlug: 'test-tenant',
    });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      params: { slug: 'test-tenant' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe('Tenant not found');
      },
    });
  });

  it('should upgrade tenant successfully', async () => {
    (requireAuth as jest.Mock).mockReturnValue({
      id: 1,
      role: 'admin',
      tenantSlug: 'test-tenant',
    });
    (prisma.tenant.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 1, slug: 'test-tenant', plan: 'free' })
      .mockResolvedValueOnce({ slug: 'test-tenant', name: 'Test Tenant', plan: 'pro' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
      tenant_id: 1,
      tenant: { slug: 'test-tenant', plan: 'pro' },
    });
    (createToken as jest.Mock).mockReturnValue('new-jwt-token');

    await testApiHandler({
      appHandler,
      params: { slug: 'test-tenant' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe('Upgraded to Pro');
        expect(json.tenant.plan).toBe('pro');
        expect(json.token).toBe('new-jwt-token');
      },
    });
  });
});