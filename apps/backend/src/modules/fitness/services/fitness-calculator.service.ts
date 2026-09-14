import { BadRequestException, Injectable } from '@nestjs/common';

export type FitnessCalculatorInput = {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  activityFactor?: number;
  bodyFatPercent?: number;
  workoutMinutes?: number;
  workoutCaloriesPerMinute?: number;
  waterActivityLevel?: 'low' | 'moderate' | 'high';
};

@Injectable()
export class FitnessCalculatorService {
  calculate(input: FitnessCalculatorInput) {
    this.validate(input);
    const bmi = input.weightKg / Math.pow(input.heightCm / 100, 2);
    const bmr = input.sex === 'male'
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;
    const activityFactor = input.activityFactor ?? 1.2;
    const tdee = bmr * activityFactor;
    const workoutCalories = Math.max(0, Math.round((input.workoutMinutes ?? 0) * (input.workoutCaloriesPerMinute ?? 0)));
    const leanMassKg = input.bodyFatPercent == null ? null : input.weightKg * (1 - input.bodyFatPercent / 100);
    const waterMl = this.waterTarget(input.weightKg, input.waterActivityLevel ?? 'moderate');
    return {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      recommendedCaloriesForFatLoss: Math.max(1200, Math.round(tdee - 350)),
      recommendedCaloriesForGain: Math.round(tdee + 250),
      workoutCalories,
      leanMassKg: leanMassKg == null ? null : Math.round(leanMassKg * 10) / 10,
      waterMl,
      activityFactor,
      methodology: 'Mifflin-St Jeor for BMR; TDEE = BMR × activity factor; water is a lifestyle estimate, not a medical prescription.',
    };
  }

  private waterTarget(weightKg: number, level: NonNullable<FitnessCalculatorInput['waterActivityLevel']>) {
    const base = weightKg * 30;
    const extra = level === 'high' ? 750 : level === 'moderate' ? 400 : 150;
    return Math.round((base + extra) / 50) * 50;
  }

  private validate(input: FitnessCalculatorInput) {
    if (!['male', 'female'].includes(input.sex)) throw new BadRequestException('sex must be male or female');
    if (!Number.isFinite(input.age) || input.age < 13 || input.age > 100) throw new BadRequestException('age must be between 13 and 100');
    if (!Number.isFinite(input.heightCm) || input.heightCm < 100 || input.heightCm > 250) throw new BadRequestException('heightCm must be between 100 and 250');
    if (!Number.isFinite(input.weightKg) || input.weightKg < 25 || input.weightKg > 350) throw new BadRequestException('weightKg must be between 25 and 350');
    if (input.activityFactor != null && (!Number.isFinite(input.activityFactor) || input.activityFactor < 1.1 || input.activityFactor > 2.5)) throw new BadRequestException('activityFactor must be between 1.1 and 2.5');
    if (input.bodyFatPercent != null && (!Number.isFinite(input.bodyFatPercent) || input.bodyFatPercent < 2 || input.bodyFatPercent > 70)) throw new BadRequestException('bodyFatPercent must be between 2 and 70');
  }
}
