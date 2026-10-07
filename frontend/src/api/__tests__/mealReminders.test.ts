import { describe, it, expect, vi } from 'vitest';

vi.mock('../client', () => ({ api: { get: vi.fn(), put: vi.fn() } }));

import { api } from '../client';
import { mealRemindersApi } from '../mealReminders';

describe('mealRemindersApi', () => {
  it('lit les rappels via GET /api/meal-reminders', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await mealRemindersApi.getAll();
    expect(api.get).toHaveBeenCalledWith('/api/meal-reminders');
  });

  it('enregistre les rappels via PUT /api/meal-reminders', async () => {
    vi.mocked(api.put).mockResolvedValue([]);
    const changes = [{ meal: 'LUNCH' as const, time: '12:30', enabled: true }];
    await mealRemindersApi.update(changes);
    expect(api.put).toHaveBeenCalledWith('/api/meal-reminders', changes);
  });
});
