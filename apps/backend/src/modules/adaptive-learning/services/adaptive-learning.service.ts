import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

type PersonalInsight = {
  key: string;
  title: string;
  description: string;
  score: number;
  category: 'nutrition' | 'hydration' | 'fitness' | 'consistency';
};

@Injectable()
export class AdaptiveLearningService {
  constructor(private readonly prisma: PrismaService) {}

  async getInsights(
    userId: string,
    dateKey = new Date().toISOString().slice(0, 10),
  ) {
    this.assertDateKey(dateKey);

    const end = new Date(`${dateKey}T23:59:59.999Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);

    const [profile, nutritionProfile, dailyLogs, workouts, meals] =
      await Promise.all([
        this.prisma.userProfile.findUnique({ where: { userId } }),
        this.prisma.nutritionProfile.findUnique({ where: { userId } }),
        this.prisma.dailyLog.findMany({
          where: {
            userId,
            dateKey: { gte: this.toDateKey(start), lte: dateKey },
          },
          orderBy: { dateKey: 'asc' },
        }),
        this.prisma.workout.findMany({
          where: {
            userId,
            performedAt: {
              gte: new Date(`${this.toDateKey(start)}T00:00:00.000Z`),
              lte: end,
            },
          },
          orderBy: { performedAt: 'desc' },
        }),
        this.prisma.meal.findMany({
          where: {
            userId,
            eatenAt: {
              gte: new Date(`${this.toDateKey(start)}T00:00:00.000Z`),
              lte: end,
            },
          },
          select: { name: true, calories: true, protein: true, eatenAt: true },
        }),
      ]);

    const loggedDays = dailyLogs.length;
    const totalCalories = dailyLogs.reduce(
      (sum, item) => sum + item.calories,
      0,
    );
    const totalProtein = dailyLogs.reduce((sum, item) => sum + item.protein, 0);
    const totalWater = dailyLogs.reduce((sum, item) => sum + item.waterMl, 0);
    const averageCalories = loggedDays
      ? Math.round(totalCalories / loggedDays)
      : 0;
    const averageProtein = loggedDays ? totalProtein / loggedDays : 0;
    const averageWater = loggedDays ? totalWater / loggedDays : 0;
    const workoutDays = new Set(
      workouts.map((item) => item.performedAt.toISOString().slice(0, 10)),
    ).size;
    const nutritionTarget = nutritionProfile?.dailyCaloriesGoal ?? 0;
    const proteinTarget = nutritionProfile?.proteinGoalGrams ?? 0;
    const waterTarget = nutritionProfile?.waterGoalMl ?? 0;
    const consistency = Math.round((loggedDays / 7) * 100);

    const insights: PersonalInsight[] = [];

    if (loggedDays === 0) {
      insights.push({
        key: 'start-tracking',
        title: 'Start with consistency',
        description:
          'You have not logged any daily data in the last seven days. A few small check-ins will give your assistant enough history to personalize recommendations.',
        score: 95,
        category: 'consistency',
      });
    } else if (consistency >= 85) {
      insights.push({
        key: 'strong-consistency',
        title: 'You are building a strong routine',
        description: `${loggedDays} of 7 days were logged. Your recent consistency is strong enough to support more personalized planning.`,
        score: consistency,
        category: 'consistency',
      });
    } else {
      insights.push({
        key: 'consistency-opportunity',
        title: 'Consistency is your biggest easy win',
        description: `${loggedDays} of 7 days were logged. Adding one more daily check-in would make your progress pattern much clearer.`,
        score: 70,
        category: 'consistency',
      });
    }

    if (waterTarget > 0 && averageWater < waterTarget * 0.8) {
      insights.push({
        key: 'hydration-gap',
        title: 'Hydration is trending low',
        description: `You averaged ${Math.round(averageWater).toLocaleString()} ml of water per logged day against a ${waterTarget.toLocaleString()} ml target. Small, repeated water check-ins should be the easiest improvement.`,
        score: 90,
        category: 'hydration',
      });
    } else if (waterTarget > 0) {
      insights.push({
        key: 'hydration-on-track',
        title: 'Hydration is mostly on track',
        description: `Your average is ${Math.round(averageWater).toLocaleString()} ml per logged day against a ${waterTarget.toLocaleString()} ml target.`,
        score: 65,
        category: 'hydration',
      });
    }

    if (proteinTarget > 0 && averageProtein < proteinTarget * 0.8) {
      insights.push({
        key: 'protein-gap',
        title: 'Protein is the main nutrition opportunity',
        description: `You averaged ${Math.round(averageProtein)} g of protein per logged day against a ${proteinTarget} g target. Planning one protein-focused meal can close a meaningful part of the gap.`,
        score: 88,
        category: 'nutrition',
      });
    } else if (proteinTarget > 0) {
      insights.push({
        key: 'protein-on-track',
        title: 'Protein intake is looking solid',
        description: `Your average is ${Math.round(averageProtein)} g per logged day against a ${proteinTarget} g target.`,
        score: 62,
        category: 'nutrition',
      });
    }

    if (nutritionTarget > 0 && averageCalories > nutritionTarget * 1.1) {
      insights.push({
        key: 'calorie-overage',
        title: 'Calories are trending above target',
        description: `Your average intake is ${averageCalories.toLocaleString()} kcal per logged day against a ${nutritionTarget.toLocaleString()} kcal target.`,
        score: 82,
        category: 'nutrition',
      });
    } else if (nutritionTarget > 0 && averageCalories < nutritionTarget * 0.8) {
      insights.push({
        key: 'calorie-under-target',
        title: 'Calories are trending below target',
        description: `Your average intake is ${averageCalories.toLocaleString()} kcal per logged day against a ${nutritionTarget.toLocaleString()} kcal target.`,
        score: 78,
        category: 'nutrition',
      });
    }

    if (workoutDays === 0) {
      insights.push({
        key: 'workout-gap',
        title: 'Training is the biggest missing signal',
        description:
          'No workouts were logged in the last seven days. Adding even two short sessions would give your assistant a much stronger view of your routine.',
        score: 84,
        category: 'fitness',
      });
    } else if (workoutDays >= 3) {
      insights.push({
        key: 'training-consistency',
        title: 'Your training rhythm is becoming consistent',
        description: `${workoutDays} active training days were recorded in the last seven days. Keep the rhythm stable before increasing volume.`,
        score: 76,
        category: 'fitness',
      });
    }

    if (meals.length > 0) {
      const latestMeal = [...meals].sort(
        (a, b) => b.eatenAt.getTime() - a.eatenAt.getTime(),
      )[0];
      if (latestMeal && latestMeal.protein >= 30) {
        insights.push({
          key: 'protein-meal-pattern',
          title: 'A protein-heavy meal is already part of your routine',
          description: `Your recent meal “${latestMeal.name}” had ${Math.round(latestMeal.protein)} g protein. Repeating patterns that work is often easier than rebuilding the whole plan.`,
          score: 58,
          category: 'nutrition',
        });
      }
    }

    insights.sort((a, b) => b.score - a.score);

    return {
      generatedAt: new Date().toISOString(),
      dateKey,
      profileGoal: profile?.primaryGoal ?? null,
      summary: this.buildSummary(insights, consistency),
      insights: insights.slice(0, 5),
    };
  }

  async getStatus(userId: string) {
    const insights = await this.getInsights(userId);
    return {
      active: true,
      engine: 'rule-based-personal-insights',
      insightCount: insights.insights.length,
      topInsight: insights.insights[0] ?? null,
      generatedAt: insights.generatedAt,
    };
  }

  private buildSummary(insights: PersonalInsight[], consistency: number) {
    if (insights.length === 0)
      return 'Keep logging a little each day and I will learn your patterns.';
    if (insights[0].key === 'strong-consistency')
      return `Your recent routine is ${consistency}% consistent. I can now make recommendations from real behavior instead of guesses.`;
    return `I found ${insights.length} useful patterns from your recent activity and ranked the most actionable ones first.`;
  }

  private assertDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new Error('dateKey must be a valid calendar date');
    }
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
