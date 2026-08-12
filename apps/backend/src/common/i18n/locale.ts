export type AppLocale = 'fa' | 'en';

export const DEFAULT_LOCALE: AppLocale = 'en';

export function normalizeLocale(value?: string | null): AppLocale {
  return value === 'fa' ? 'fa' : DEFAULT_LOCALE;
}

export const messages = {
  en: {
    notifications: {
      reminder: 'Reminder',
      workout: 'Workout time',
      supplement: 'Supplement reminder',
      habit: 'Habit check-in',
      goal: 'Goal check-in',
    },
    tasks: {
      workout: 'Workout',
      walk: 'Walk',
      hydration: 'Drink water',
    },
  },
  fa: {
    notifications: {
      reminder: 'یادآوری',
      workout: 'وقت تمرینه',
      supplement: 'یادآوری مکمل',
      habit: 'ثبت عادت',
      goal: 'پیگیری هدف',
    },
    tasks: {
      workout: 'تمرین ورزشی',
      walk: 'پیاده‌روی',
      hydration: 'نوشیدن آب',
    },
  },
} as const;
