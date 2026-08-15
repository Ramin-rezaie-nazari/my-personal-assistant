import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { normalizeLocale } from '../../../common/i18n/locale';

export type SmartNotificationResult = {
  enabled: boolean;
  created: number;
  rules: string[];
};

@Injectable()
export class SmartNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForUser(userId: string, dateKey = new Date().toISOString().slice(0, 10)): Promise<SmartNotificationResult> {
    const preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { notificationsEnabled: true },
    });

    if (preferences?.notificationsEnabled === false) {
      return { enabled: false, created: 0, rules: [] };
    }

    const settings = await this.prisma.userSettings.findUnique({ where: { userId }, select: { language: true } });
    const locale = normalizeLocale(settings?.language);
    const fa = locale === 'fa';

    const [daily, nutrition, habits, supplements, workouts] = await Promise.all([
      this.prisma.dailyLog.findUnique({ where: { userId_dateKey: { userId, dateKey } } }),
      this.prisma.nutritionProfile.findUnique({
        where: { userId },
        select: { dailyCaloriesGoal: true, proteinGoalGrams: true, waterGoalMl: true },
      }),
      this.prisma.habit.findMany({
        where: { userId, active: true },
        include: { logs: { where: { dateKey }, take: 1 } },
      }),
      this.prisma.supplement.findMany({
        where: { userId, active: true },
        include: { logs: { where: { dateKey }, take: 1 } },
        orderBy: { scheduledTime: 'asc' },
      }),
      this.prisma.workout.findMany({
        where: { userId, performedAt: { gte: new Date(`${dateKey}T00:00:00.000Z`) } },
        take: 1,
      }),
    ]);

    const notifications: Array<{
      userId: string;
      title: string;
      body: string;
      type: string;
      scheduledAt: Date;
      dedupeKey: string;
      priority: number;
    }> = [];
    const now = new Date();
    const rules: string[] = [];

    if (nutrition?.waterGoalMl && (daily?.waterMl ?? 0) < nutrition.waterGoalMl * 0.5) {
      rules.push('hydration-low');
      notifications.push({
        userId,
        title: fa ? 'آب امروزت کمه 💧' : 'Hydration needs a boost 💧',
        body: fa
          ? `تا الان ${daily?.waterMl ?? 0} میلی‌لیتر آب خوردی و هدفت ${nutrition.waterGoalMl} میلی‌لیتره. یک لیوان آب الان کمک می‌کنه.`
          : `You are at ${daily?.waterMl ?? 0} ml of your ${nutrition.waterGoalMl} ml water goal. A quick glass now will help.`,
        type: 'hydration',
        scheduledAt: now,
        dedupeKey: `${dateKey}:hydration-low`,
        priority: 1,
      });
    }

    if (nutrition?.proteinGoalGrams && (daily?.protein ?? 0) < nutrition.proteinGoalGrams * 0.5) {
      rules.push('protein-low');
      notifications.push({
        userId,
        title: fa ? 'پروتئین امروز عقب افتاده 🥩' : 'Protein is lagging today 🥩',
        body: fa
          ? `تا الان ${Math.round(daily?.protein ?? 0)} گرم پروتئین داری و هدفت ${nutrition.proteinGoalGrams} گرمه.`
          : `You have ${Math.round(daily?.protein ?? 0)} g so far against a ${nutrition.proteinGoalGrams} g goal.`,
        type: 'nutrition',
        scheduledAt: now,
        dedupeKey: `${dateKey}:protein-low`,
        priority: 1,
      });
    }

    const pendingHabits = habits.filter((habit) => habit.logs.length === 0);
    if (pendingHabits.length > 0) {
      rules.push('habits-pending');
      const names = pendingHabits.slice(0, 2).map((habit) => habit.name).join(fa ? ' و ' : ' and ');
      notifications.push({
        userId,
        title: fa ? `${pendingHabits.length} عادت هنوز بازه ✅` : `${pendingHabits.length} habit${pendingHabits.length > 1 ? 's are' : ' is'} still open ✅`,
        body: fa ? `برای حفظ ریتم امروزت ${names} رو انجام بده.` : `Keep your rhythm going with ${names}.`,
        type: 'habit',
        scheduledAt: now,
        dedupeKey: `${dateKey}:habits-pending`,
        priority: 2,
      });
    }

    const pendingSupplements = supplements.filter((item) => item.logs.length === 0);
    if (pendingSupplements.length > 0) {
      rules.push('supplements-pending');
      const names = pendingSupplements.slice(0, 2).map((item) => item.name).join(fa ? ' و ' : ' and ');
      notifications.push({
        userId,
        title: fa ? 'وضعیت مکمل‌ها 💊' : 'Supplement check 💊',
        body: fa ? `${names} هنوز برای امروز ثبت نشده.` : `${names} ${pendingSupplements.length > 1 ? 'are' : 'is'} still marked as not taken today.`,
        type: 'supplement',
        scheduledAt: now,
        dedupeKey: `${dateKey}:supplements-pending`,
        priority: 2,
      });
    }

    if (workouts.length === 0) {
      rules.push('movement-missing');
      notifications.push({
        userId,
        title: fa ? 'کمی تحرک امروزت رو بهتر می‌کنه 🏃' : 'A little movement would help 🏃',
        body: fa ? 'امروز هنوز تمرینی ثبت نکردی؛ حتی یک پیاده‌روی کوتاه هم حساب می‌شه.' : 'You have not logged a workout today. Even a short walk counts.',
        type: 'workout',
        scheduledAt: now,
        dedupeKey: `${dateKey}:movement-missing`,
        priority: 3,
      });
    }

    if (!notifications.length) return { enabled: true, created: 0, rules };

    const result = await this.prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    return { enabled: true, created: result.count, rules };
  }
}
