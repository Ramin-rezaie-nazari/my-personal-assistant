import { BrainDailyStatusService } from './brain-daily-status.service';
import { DailyService } from '../../daily/services/daily.service';

describe('BrainDailyStatusService', () => {
  it('maps the authenticated user daily log into brain status', async () => {
    const dailyService = {
      getDailyLog: jest.fn().mockResolvedValue({
        waterMl: 1800,
        calories: 1450,
        protein: 95,
      }),
    } as unknown as DailyService;

    const service = new BrainDailyStatusService(dailyService);

    await expect(service.getToday('user-1')).resolves.toEqual({
      dateKey: expect.any(String),
      hasLog: true,
      waterMl: 1800,
      calories: 1450,
      protein: 95,
    });

    expect(dailyService.getDailyLog).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
  });

  it('returns zeroed status when no daily log exists', async () => {
    const dailyService = {
      getDailyLog: jest.fn().mockResolvedValue(null),
    } as unknown as DailyService;

    const service = new BrainDailyStatusService(dailyService);

    await expect(service.getToday('user-2')).resolves.toEqual({
      dateKey: expect.any(String),
      hasLog: false,
      waterMl: 0,
      calories: 0,
      protein: 0,
    });
  });
});
