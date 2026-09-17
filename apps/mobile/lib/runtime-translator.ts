import AsyncStorage from '@react-native-async-storage/async-storage';
import { onTranslateTask } from '../modules/expo-translate-text/src';
import type { AppLocale } from './languages';

const CACHE_PREFIX = '@my-personal-assistant/i18n-pack-v1:';
const memory = new Map<AppLocale, Record<string, string>>();
const pending = new Map<AppLocale, Promise<boolean>>();

function targetCode(locale: AppLocale): string {
  switch (locale) {
    case 'zh': return 'zh';
    default: return locale;
  }
}

function isMeaningfulText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && /[\p{L}]/u.test(value);
}

export function getCachedTranslation(locale: AppLocale, key: string, fallback: string): string {
  return memory.get(locale)?.[key] ?? fallback;
}

export async function hydrateLocale(locale: AppLocale): Promise<boolean> {
  if (locale === 'en') return true;
  if (memory.has(locale)) return true;
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${locale}`);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pack: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') pack[key] = value;
    }
    memory.set(locale, pack);
    return Object.keys(pack).length > 0;
  } catch {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${locale}`);
    return false;
  }
}

export async function preloadLocale(locale: AppLocale, sourcePack: Record<string, string>): Promise<boolean> {
  if (locale === 'en') return true;
  if (await hydrateLocale(locale)) return true;
  const existing = pending.get(locale);
  if (existing) return existing;

  const work = (async () => {
    const input: Record<string, string> = {};
    for (const [key, value] of Object.entries(sourcePack)) {
      if (isMeaningfulText(value)) input[key] = value;
    }
    try {
      const result = await onTranslateTask({
        input,
        sourceLangCode: 'en',
        targetLangCode: targetCode(locale),
        requiresWifi: false,
        requireCharging: false,
      });
      const translated = (result.translatedTexts ?? {}) as Record<string, unknown>;
      const pack: Record<string, string> = {};
      for (const key of Object.keys(sourcePack)) {
        const value = translated[key];
        pack[key] = typeof value === 'string' && value.trim() ? value : sourcePack[key];
      }
      memory.set(locale, pack);
      await AsyncStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(pack));
      return true;
    } catch {
      // Keep the app usable when a platform translation model cannot be
      // downloaded or the OS does not expose the native translation API.
      return false;
    } finally {
      pending.delete(locale);
    }
  })();

  pending.set(locale, work);
  return work;
}

export async function translateDynamicText(locale: AppLocale, text: string): Promise<string> {
  if (locale === 'en' || !isMeaningfulText(text)) return text;
  const cacheKey = `dynamic:${text}`;
  const cached = getCachedTranslation(locale, cacheKey, '');
  if (cached) return cached;
  try {
    const result = await onTranslateTask({ input: text, sourceLangCode: 'en', targetLangCode: targetCode(locale), requiresWifi: false, requireCharging: false });
    const translated = typeof result.translatedTexts === 'string' ? result.translatedTexts : text;
    const pack = memory.get(locale) ?? {};
    pack[cacheKey] = translated;
    memory.set(locale, pack);
    await AsyncStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(pack));
    return translated;
  } catch {
    return text;
  }
}
