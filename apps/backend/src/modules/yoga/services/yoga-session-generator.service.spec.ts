import { YogaLibraryService } from './yoga-library.service';
import { YogaSessionGeneratorService } from './yoga-session-generator.service';

describe('YogaSessionGeneratorService', () => {
  const service = new YogaSessionGeneratorService(new YogaLibraryService());

  it('creates a bounded session for requested duration', () => {
    const session = service.generate({ durationMin: 30, level: 'beginner', focus: 'mobility' });
    expect(session.durationMin).toBe(30);
    expect(session.steps.length).toBeGreaterThan(0);
    expect(session.estimatedDifficulty).toBeGreaterThanOrEqual(0);
  });

  it('levels up after strong recent performance', () => {
    const session = service.generate({ durationMin: 20, progress: { currentLevel: 'foundation', completionRate: 0.98, formScoreAvg: 0.95, recentDifficulty: 0.4 } });
    expect(session.level).toBe('intermediate');
  });
});
