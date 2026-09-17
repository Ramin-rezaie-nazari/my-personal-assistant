export type AppLocale =
  | 'en' | 'fa' | 'ar' | 'bn' | 'bg' | 'ca' | 'cs' | 'da' | 'de' | 'el' | 'es' | 'et' | 'fi' | 'fr' | 'gu'
  | 'he' | 'hi' | 'hr' | 'hu' | 'id' | 'it' | 'ja' | 'ka' | 'kn' | 'ko' | 'lt' | 'lv' | 'mk' | 'mr' | 'ms' | 'mt'
  | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'ru' | 'sk' | 'sl' | 'sq' | 'sv' | 'sw' | 'ta' | 'te' | 'th' | 'tl' | 'tr'
  | 'uk' | 'ur' | 'vi' | 'zh';

export const DEFAULT_LOCALE: AppLocale = 'en';
export const SUPPORTED_LOCALES: readonly AppLocale[] = [
  'en', 'fa', 'ar', 'bn', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 'gu',
  'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ka', 'kn', 'ko', 'lt', 'lv', 'mk', 'mr', 'ms', 'mt',
  'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sq', 'sv', 'sw', 'ta', 'te', 'th', 'tl', 'tr',
  'uk', 'ur', 'vi', 'zh',
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
  notifications: { reminder: 'Reminder', workout: 'Workout time', supplement: 'Supplement reminder', habit: 'Habit check-in', goal: 'Goal check-in' },
  tasks: { workout: 'Workout', walk: 'Walk', hydration: 'Drink water' },
};

const persian: MessagePack = {
  notifications: { reminder: 'یادآوری', workout: 'وقت تمرینه', supplement: 'یادآوری مکمل', habit: 'ثبت عادت', goal: 'پیگیری هدف' },
  tasks: { workout: 'تمرین ورزشی', walk: 'پیاده‌روی', hydration: 'نوشیدن آب' },
};

export const messages: Record<AppLocale, MessagePack> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, locale === 'fa' ? persian : english]),
) as Record<AppLocale, MessagePack>;
