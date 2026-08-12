import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLocale = 'fa' | 'en';
export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_STORAGE_KEY = '@my-personal-assistant/locale';

export const translations = {
  en: {
    languageTitle: 'Choose your language', languageSubtitle: 'Your assistant will use this language everywhere.', persian: 'فارسی', english: 'English', continue: 'Continue',
    welcome: 'Welcome 👋', signIn: 'Sign in', createAccount: 'Create account', email: 'Email', password: 'Password', firstName: 'First name', lastName: 'Last name',
    today: 'Today', quickActions: 'Quick actions', calories: 'Calories', protein: 'Protein', water: 'Water', training: 'Training', recentMeals: 'Recent meals', notifications: 'Notifications',
    goal: 'Goal', habits: 'Habits', reminders: 'Reminders', supplements: 'Supplements', workout: 'Workout', progress: 'Progress', settings: 'Settings', logOut: 'Log out', retry: 'Retry',
  },
  fa: {
    languageTitle: 'زبان خودت را انتخاب کن', languageSubtitle: 'دستیار تو همه‌جا با همین زبان با تو صحبت می‌کند.', persian: 'فارسی', english: 'English', continue: 'ادامه',
    welcome: 'خوش اومدی 👋', signIn: 'ورود', createAccount: 'ساخت حساب', email: 'ایمیل', password: 'رمز عبور', firstName: 'نام', lastName: 'نام خانوادگی',
    today: 'امروز', quickActions: 'دسترسی‌های سریع', calories: 'کالری', protein: 'پروتئین', water: 'آب', training: 'تمرین', recentMeals: 'غذاهای اخیر', notifications: 'اعلان‌ها',
    goal: 'هدف', habits: 'عادت‌ها', reminders: 'یادآوری‌ها', supplements: 'مکمل‌ها', workout: 'ورزش', progress: 'پیشرفت', settings: 'تنظیمات', logOut: 'خروج', retry: 'تلاش دوباره',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(locale: AppLocale, key: TranslationKey): string {
  return translations[locale][key];
}

export async function getStoredLocale(): Promise<AppLocale | null> {
  const value = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  return value === 'fa' || value === 'en' ? value : null;
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function isRTL(locale: AppLocale): boolean {
  return locale === 'fa';
}
