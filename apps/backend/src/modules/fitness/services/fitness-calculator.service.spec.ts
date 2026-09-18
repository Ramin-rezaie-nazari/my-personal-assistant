import { BadRequestException } from '@nestjs/common';
import { FitnessCalculatorService } from './fitness-calculator.service';

describe('FitnessCalculatorService', () => {
  const service = new FitnessCalculatorService();

  it('calculates BMI, BMR, TDEE, water and body-composition metrics', () => {
    const result = service.calculate({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityFactor: 1.55,
      bodyFatPercent: 20,
      workoutMinutes: 40,
      workoutCaloriesPerMinute: 8,
      waterActivityLevel: 'moderate',
    });

    expect(result.bmi).toBeCloseTo(24.7, 1);
    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2759);
    expect(result.workoutCalories).toBe(320);
    expect(result.leanMassKg).toBe(64);
    expect(result.waterMl).toBe(2800);
  });

  it('rejects values outside the bounded calculation domain', () => {
    expect(() => service.calculate({ sex: 'male', age: 10, heightCm: 180, weightKg: 80 })).toThrow(BadRequestException);
    expect(() => service.calculate({ sex: 'male', age: 30, heightCm: 300, weightKg: 80 })).toThrow(BadRequestException);
    expect(() => service.calculate({ sex: 'male', age: 30, heightCm: 180, weightKg: 400 })).toThrow(BadRequestException);
  });
});
