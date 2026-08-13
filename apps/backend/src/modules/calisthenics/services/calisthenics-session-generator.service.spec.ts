import { CalisthenicsLibraryService } from './calisthenics-library.service';
import { CalisthenicsSessionGeneratorService } from './calisthenics-session-generator.service';

describe('CalisthenicsSessionGeneratorService', () => {
  const generator = new CalisthenicsSessionGeneratorService(new CalisthenicsLibraryService());

  it('builds equipment-free sessions without unavailable equipment', () => {
    const session = generator.generate({ durationMin: 30, level: 'beginner', equipment: ['none'] });
    expect(session.steps.length).toBeGreaterThan(0);
    expect(session.steps.every((step) => ['pull_up', 'l_sit', 'muscle_up', 'handstand_push_up'].every((id) => step.exerciseId !== id))).toBe(true);
  });

  it('levels up when form and completion are consistently high', () => {
    const session = generator.generate({ durationMin: 30, level: 'foundation', equipment: ['none'], progress: { currentLevel: 'foundation', formScoreAvg: 0.95, completionRate: 0.96 } });
    expect(session.level).toBe('intermediate');
  });
});
