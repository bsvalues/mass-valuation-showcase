import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/trpc';

describe('deleteCountyParcels', () => {
  it('should return 0 deleted count for county with no data', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' },
    } as TrpcContext);

    const result = await caller.parcels.deleteCountyParcels({ county: 'TestCounty' });

    expect(result.county).toBe('TestCounty');
    expect(result.deletedCount).toBe(0);
  });

  it('should accept valid county names', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' },
    } as TrpcContext);

    // Should not throw for valid county name
    const result = await caller.parcels.deleteCountyParcels({ county: 'King' });
    expect(result).toHaveProperty('deletedCount');
    expect(result).toHaveProperty('county');
  });
});
