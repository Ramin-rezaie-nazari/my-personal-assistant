import { BadRequestException } from '@nestjs/common';
import { FitnessController } from './fitness.controller';

describe('FitnessController', () => {
  const profile = {
    get: jest.fn(),
    buildRecommendationContext: jest.fn(),
    save: jest.fn(),
    addEquipment: jest.fn(),
    removeEquipment: jest.fn(),
    addGoal: jest.fn(),
    parseNaturalGoal: jest.fn(),
  };
  const catalog = {
    list: jest.fn(),
    getOne: jest.fn(),
  };
  const progress = {
    list: jest.fn(),
    get: jest.fn(),
    recordSession: jest.fn(),
  };

  let controller: FitnessController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FitnessController(profile as never, catalog as never, progress as never);
  });

  it('uses the authenticated user id for profile access', () => {
    controller.getProfile({ user: { id: 'user-1' } });
    expect(profile.get).toHaveBeenCalledWith('user-1');
    expect(profile.get).not.toHaveBeenCalledWith(undefined);
  });

  it('uses the authenticated user id for progress writes', () => {
    const body = { discipline: 'gym' as const, difficulty: 7, completed: true };
    controller.recordProgress({ user: { id: 'user-1' } }, body);
    expect(progress.recordSession).toHaveBeenCalledWith({ userId: 'user-1', ...body });
  });

  it('rejects an invalid progress discipline before calling the service', () => {
    expect(() =>
      controller.recordProgress(
        { user: { id: 'user-1' } },
        { discipline: 'invalid' as never, difficulty: 5, completed: false },
      ),
    ).toThrow(BadRequestException);
    expect(progress.recordSession).not.toHaveBeenCalled();
  });
});
