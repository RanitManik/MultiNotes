import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../app/api/health/route';

describe('Health API', () => {
  it('should return 200 and status ok', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ status: 'ok' });
      },
    });
  });
});