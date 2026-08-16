import { GoalHierarchyService } from './goal-hierarchy.service';

describe('GoalHierarchyService', () => {
  it('ranks near-term goals above distant goals with equal priority', () => {
    const service = new GoalHierarchyService();
    const result = service.rank(
      [
        {
          id: 'near',
          title: 'Near',
          category: 'general',
          priority: 5,
          progressPercent: 20,
          targetDate: '2026-08-18',
          daysRemaining: 5,
        },
        {
          id: 'far',
          title: 'Far',
          category: 'general',
          priority: 5,
          progressPercent: 20,
          targetDate: '2026-12-01',
          daysRemaining: 110,
        },
      ],
      new Date('2026-08-13T07:00:00Z'),
    );

    expect(result[0].id).toBe('near');
    expect(result[0].horizon).toBe('urgent');
  });
});
