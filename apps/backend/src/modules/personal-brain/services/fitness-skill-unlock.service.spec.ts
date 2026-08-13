import { FitnessSkillUnlockService } from './fitness-skill-unlock.service';

describe('FitnessSkillUnlockService', () => {
  const skill = {
    id: 'pistol_squat',
    name: 'Pistol Squat',
    difficulty: 8,
    regressionId: 'split_squat',
  };

  const createService = (trendOverrides: any[] = [], memoryOverrides: any = {}) => {
    const library = {
      get: jest.fn((id: string) => id === skill.id ? skill : ({ id, name: id, difficulty: 3 })),
    } as any;
    const memory = {
      get: jest.fn(async () => ({
        averageRecovery: 0.85,
        averageForm: 0.93,
        exerciseTrends: trendOverrides,
        ...memoryOverrides,
      })),
    } as any;
    return new FitnessSkillUnlockService(library, memory);
  };

  it('locks a skill when its prerequisite has insufficient history or form', async () => {
    const service = createService([{ exerciseId: 'split_squat', sessions: 1, latestScore: 0.82 }]);
    const result = await service.evaluateCalisthenicsSkills('u1', ['pistol_squat']);
    expect(result[0].status).toBe('locked');
    expect(result[0].missingPrerequisites).toEqual(['split_squat']);
  });

  it('marks a skill ready when prerequisite and current performance are strong', async () => {
    const service = createService([{ exerciseId: 'split_squat', sessions: 4, latestScore: 0.92 }]);
    const result = await service.evaluateCalisthenicsSkills('u1', ['pistol_squat']);
    expect(result[0].status).toBe('ready');
    expect(result[0].missingPrerequisites).toEqual([]);
  });
});
