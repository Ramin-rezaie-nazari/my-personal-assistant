import { FitnessProfileService } from './fitness-profile.service';

describe('FitnessProfileService', () => {
  it('maps a natural body-sculpt goal to target areas and avoids bulk when requested', () => {
    const service = new FitnessProfileService();
    const goal = service.parseNaturalGoal(
      'می‌خوام ران‌هام لاغرتر و خوش‌فرم‌تر بشن و حجم زیادی عضله نگیرم',
    );

    expect(goal.kind).toBe('fat_loss');
    expect(goal.targetAreas).toContain('thighs');
    expect(goal.avoidBulk).toBe(true);
  });

  it('builds a bodyweight-only context when no equipment is active', () => {
    const service = new FitnessProfileService();
    service.save('user-1', {
      disciplines: ['calisthenics'],
      goals: [],
      equipment: [],
      constraints: [],
      preferredSessionMinutes: [20],
    });

    const context = service.buildRecommendationContext('user-1');
    expect(context.equipment).toEqual(['none']);
  });
});
