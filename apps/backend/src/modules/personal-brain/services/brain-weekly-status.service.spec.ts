import { BrainWeeklyStatusService } from './brain-weekly-status.service';
import { DailyService } from '../../daily/services/daily.service';

describe('BrainWeeklyStatusService', () => {
  it('builds a seven-day summary', async () => {
    const dailyService = { getDailyLogs: jest.fn().mockResolvedValue([{ dateKey: '2026-08-07', waterMl: 1500, calories: 1800, protein: 90 }, { dateKey: '2026-08-08', waterMl: 1700, calories: 1900, protein: 100 }, { dateKey: '2026-08-09', waterMl: 1600, calories: 1750, protein: 95 }, { dateKey: '2026-08-10', waterMl: 1800, calories: 1850, protein: 105 }, { dateKey: '2026-08-11', waterMl: 2000, calories: 1700, protein: 110 }, { dateKey: '2026-08-12', waterMl: 2100, calories: 1650, protein: 115 }]) } as unknown as DailyService;
    const result = await new BrainWeeklyStatusService(dailyService).getThisWeek('user-1', new Date('2026-08-13T12:00:00Z'));
    expect(result.loggedDays).toBe(6); expect(result.consistencyPercent).toBe(86); expect(result.currentStreak).toBe(0); expect(result.totalCalories).toBe(10650); expect(result.totalProtein).toBe(615); expect(result.totalWaterMl).toBe(10700); expect(dailyService.getDailyLogs).toHaveBeenCalledWith('user-1', '2026-08-07', '2026-08-13');
  });
});
