export type AppLocale =
  | 'en' | 'fa' | 'ar' | 'tr' | 'az' | 'ru' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'uk' | 'ro' | 'el'
  | 'sv' | 'nb' | 'da' | 'fi' | 'cs' | 'sk' | 'hu' | 'bg' | 'hr' | 'sr' | 'he' | 'hi' | 'ur' | 'bn' | 'pa'
  | 'gu' | 'ta' | 'te' | 'mr' | 'id' | 'ms' | 'th' | 'vi' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'fil' | 'sw' | 'am'
  | 'so' | 'kk' | 'uz' | 'hy' | 'ku';

export const DEFAULT_LOCALE: AppLocale = 'en';

export const SUPPORTED_LOCALES: readonly AppLocale[] = [
  'en', 'fa', 'ar', 'tr', 'az', 'ru', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'uk', 'ro', 'el',
  'sv', 'nb', 'da', 'fi', 'cs', 'sk', 'hu', 'bg', 'hr', 'sr', 'he', 'hi', 'ur', 'bn', 'pa',
  'gu', 'ta', 'te', 'mr', 'id', 'ms', 'th', 'vi', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fil', 'sw', 'am',
  'so', 'kk', 'uz', 'hy', 'ku',
];

const supported = new Set<string>(SUPPORTED_LOCALES);

export function normalizeLocale(value?: string | null): AppLocale {
  return value && supported.has(value) ? value as AppLocale : DEFAULT_LOCALE;
}

type MessagePack = {
  notifications: {
    reminder: string;
    workout: string;
    supplement: string;
    habit: string;
    goal: string;
  };
  tasks: {
    workout: string;
    walk: string;
    hydration: string;
  };
};

const english: MessagePack = {
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
};

const persian: MessagePack = {
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
};

// The backend now accepts and persists all 51 locales. Until a locale has a
// dedicated server-side message pack, its runtime notification/task copy uses
// the canonical English fallback rather than rejecting the user's language.
export const messages: Record<AppLocale, MessagePack> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, locale === 'fa' ? persian : english]),
) as Record<AppLocale, MessagePack>;
