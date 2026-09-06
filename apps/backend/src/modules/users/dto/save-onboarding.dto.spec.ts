import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveOnboardingDto } from './save-onboarding.dto';

const validPayload = {
  gender: 'female',
  birthDate: '1990-01-15T00:00:00.000Z',
  heightCm: 172,
  weightKg: 68,
  goal: 'body_sculpt',
  fitnessLevel: 'foundation',
  diet: 'balanced',
  workoutPlace: 'both',
  trainingDaysPerWeek: 4,
  equipment: 'home',
  sessionMinutes: 45,
  notificationsEnabled: true,
};

describe('SaveOnboardingDto validation', () => {
  it('accepts a valid onboarding payload', async () => {
    const errors = await validate(plainToInstance(SaveOnboardingDto, validPayload));
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['heightCm', Number.NaN],
    ['heightCm', Number.POSITIVE_INFINITY],
    ['weightKg', Number.NaN],
    ['weightKg', Number.NEGATIVE_INFINITY],
  ])('rejects non-finite %s values', async (field, value) => {
    const payload = { ...validPayload, [field]: value };
    const errors = await validate(plainToInstance(SaveOnboardingDto, payload));
    expect(errors.some((error) => error.property === field)).toBe(true);
  });

  it('rejects unsupported categorical values', async () => {
    const errors = await validate(plainToInstance(SaveOnboardingDto, {
      ...validPayload,
      goal: 'anything',
      trainingDaysPerWeek: 7,
    }));
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['goal', 'trainingDaysPerWeek']));
  });
});
