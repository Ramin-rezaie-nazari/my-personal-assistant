import { BadRequestException } from '@nestjs/common';
import { FitnessCalculatorService } from './fitness-calculator.service';

describe('FitnessCalculatorService', () => {
  const service = new FitnessCalculatorService();

  it('calculates BMI, BMR, TDEE and water target', () => {
    const result = service.calculate({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityFactor: 1.55, workoutMinutes: 45, workoutCaloriesPerMinute: 8, waterActivityLevel: 'moderate' });
    expect(result.bmi).toBe(24.7);
    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2759);
    expect(result.workoutCalories).toBe(360);
    expect(result.waterMl).toBe(2800);
  });

  it('returns lean mass only when body fat is supplied', () => {
    expect(service.calculate({ sex: 'female', age: 35, heightCm: 165, weightKg: 70 }).leanMassKg).toBeNull();
    expect(service.calculate({ sex: 'female', age: 35, heightCm: 165, weightKg: 70, bodyFatPercent: 25 }).leanMassKg).toBe(52.5);
  });

  it('rejects impossible profile values', () => {
    expect(() => service.calculate({ sex: 'male', age: 8, heightCm: 180, weightKg: 80 })).toThrow(BadRequestException);
    expect(() => service.calculate({ sex: 'male', age: 30, heightCm: 300, weightKg: 80 })).toThrow(BadRequestException);
  });
});
