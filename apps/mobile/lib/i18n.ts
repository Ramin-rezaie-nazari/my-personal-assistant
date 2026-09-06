import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type AppLocale = 'fa' | 'en';
export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_STORAGE_KEY = '@my-personal-assistant/locale';

type LocaleListener = () => void;
let currentLocale: AppLocale = DEFAULT_LOCALE;
let initialized = false;
const listeners = new Set<LocaleListener>();

export const translations = {
  en: {
    languageTitle: 'Choose your language', languageSubtitle: 'Your assistant will use this language everywhere.', persian: 'Persian', english: 'English', continue: 'Continue',
    welcome: 'Welcome 👋', signIn: 'Sign in', createAccount: 'Create account', email: 'Email', password: 'Password', firstName: 'First name', lastName: 'Last name',
    today: 'Today', quickActions: 'Quick actions', calories: 'Calories', protein: 'Protein', water: 'Water', training: 'Training', recentMeals: 'Recent meals', notifications: 'Notifications',
    goal: 'Goal', habits: 'Habits', reminders: 'Reminders', supplements: 'Supplements', workout: 'Workout', progress: 'Progress', settings: 'Settings', logOut: 'Log out', retry: 'Retry',
    home: 'Home', calendar: 'Calendar', inbox: 'Inbox', meals: 'Meals', nutrition: 'Nutrition', inventory: 'Inventory', shopping: 'Shopping', fitness: 'Fitness', assistant: 'Assistant',
    loading: 'Loading…', save: 'Save', cancel: 'Cancel', back: 'Back', next: 'Next', done: 'Done', open: 'Open', close: 'Close', edit: 'Edit', delete: 'Delete', add: 'Add',
    commandWaterLogged: '500 ml of water logged.', commandWalkLogged: '20 min walk logged.', commandStrengthLogged: '45 min strength workout logged.', commandReminderCreated: 'Reminder created for 20:00.', commandReminderTitle: 'Check in with My Personal Assistant',
  },
  fa: {
    languageTitle: 'زبان خودت را انتخاب کن', languageSubtitle: 'دستیار تو همه‌جا با همین زبان با تو صحبت می‌کند.', persian: 'فارسی', english: 'English', continue: 'ادامه',
    welcome: 'خوش اومدی 👋', signIn: 'ورود', createAccount: 'ساخت حساب', email: 'ایمیل', password: 'رمز عبور', firstName: 'نام', lastName: 'نام خانوادگی',
    today: 'امروز', quickActions: 'دسترسی‌های سریع', calories: 'کالری', protein: 'پروتئین', water: 'آب', training: 'تمرین', recentMeals: 'غذاهای اخیر', notifications: 'اعلان‌ها',
    goal: 'هدف', habits: 'عادت‌ها', reminders: 'یادآوری‌ها', supplements: 'مکمل‌ها', workout: 'ورزش', progress: 'پیشرفت', settings: 'تنظیمات', logOut: 'خروج', retry: 'تلاش دوباره',
    home: 'خانه', calendar: 'تقویم', inbox: 'صندوق اعلان‌ها', meals: 'غذاها', nutrition: 'تغذیه', inventory: 'موجودی خانه', shopping: 'خرید', fitness: 'تمرین', assistant: 'دستیار',
    loading: 'در حال بارگذاری…', save: 'ذخیره', cancel: 'لغو', back: 'برگشت', next: 'بعدی', done: 'انجام شد', open: 'باز کردن', close: 'بستن', edit: 'ویرایش', delete: 'حذف', add: 'افزودن',
    commandWaterLogged: '۵۰۰ میلی‌لیتر آب ثبت شد.', commandWalkLogged: '۲۰ دقیقه پیاده‌روی ثبت شد.', commandStrengthLogged: 'تمرین قدرتی ۴۵ دقیقه‌ای ثبت شد.', commandReminderCreated: 'یادآوری برای ساعت ۲۰:۰۰ ساخته شد.', commandReminderTitle: 'پیگیری با دستیار شخصی من',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(locale: AppLocale, key: TranslationKey): string {
  return translations[locale][key];
}

export function getAppLocale(): AppLocale {
  return currentLocale;
}

export function subscribeLocale(listener: LocaleListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitLocaleChange(): void {
  for (const listener of listeners) listener();
}

export function setAppLocale(locale: AppLocale): void {
  currentLocale = locale;
  emitLocaleChange();
}

export async function initializeLocale(): Promise<AppLocale> {
  const stored = await getStoredLocale();
  currentLocale = stored ?? DEFAULT_LOCALE;
  initialized = true;
  emitLocaleChange();
  return currentLocale;
}

export function useAppLocale(): AppLocale {
  const snapshot = useSyncExternalStore(subscribeLocale, getAppLocale, getAppLocale);
  return snapshot;
}

export function isLocaleInitialized(): boolean {
  return initialized;
}

export async function getStoredLocale(): Promise<AppLocale | null> {
  const value = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  return value === 'fa' || value === 'en' ? value : null;
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  setAppLocale(locale);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function isRTL(locale: AppLocale): boolean {
  return locale === 'fa';
}
