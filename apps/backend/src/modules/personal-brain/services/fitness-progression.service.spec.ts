import { FitnessProgressionService } from './fitness-progression.service';

describe('FitnessProgressionService', () => {
  const service = new FitnessProgressionService();

  it('progresses when form/completion are strong and difficulty is low', () => {
    const result = service.evaluate({
      formScoreAvg: 0.94,
      completionRate: 0.96,
      recentDifficulty: 0.4,
      recoveryScore: 0.9,
    });
    expect(result.action).toBe('progress');
    expect(result.levelDelta).toBe(1);
  });

  it('regresses when form is weak', () => {
    const result = service.evaluate({
      formScoreAvg: 0.55,
      completionRate: 0.9,
      recentDifficulty: 0.5,
      recoveryScore: 0.8,
    });
    expect(result.action).toBe('regress');
    expect(result.levelDelta).toBe(-1);
  });

  it('deloads when recovery is low even when performance is otherwise good', () => {
    const result = service.evaluate({
      formScoreAvg: 0.95,
      completionRate: 0.94,
      recentDifficulty: 0.45,
      recoveryScore: 0.3,
    });
    expect(result.action).toBe('deload');
    expect(result.volumeMultiplier).toBeLessThan(1);
  });
});
