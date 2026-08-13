import { GymLibraryService } from './gym-library.service';
import { GymSessionGeneratorService } from './gym-session-generator.service';

describe('GymSessionGeneratorService', () => {
  const service = new GymSessionGeneratorService(new GymLibraryService());

  it('uses available equipment when generating a session', () => {
    const session = service.generate({ durationMin: 40, equipment: ['dumbbells'], focus: 'shoulders' });
    expect(session.steps.length).toBeGreaterThan(0);
    expect(session.steps.every((step) => step.exerciseId === 'lateral-raise')).toBe(true);
  });

  it('does not select unavailable cable-only exercises', () => {
    const session = service.generate({ durationMin: 40, equipment: ['dumbbells', 'bench'], focus: 'back' });
    expect(session.steps.some((step) => step.exerciseId === 'cable-row' || step.exerciseId === 'lat-pulldown')).toBe(false);
  });

  it('reduces volume when avoidBulk is true', () => {
    const normal = service.generate({ durationMin: 40, equipment: ['dumbbells'], focus: 'full_body', avoidBulk: false });
    const sculpt = service.generate({ durationMin: 40, equipment: ['dumbbells'], focus: 'full_body', avoidBulk: true });
    const normalSets = normal.steps.reduce((sum, step) => sum + step.sets, 0);
    const sculptSets = sculpt.steps.reduce((sum, step) => sum + step.sets, 0);
    expect(sculptSets).toBeLessThanOrEqual(normalSets);
  });
});
