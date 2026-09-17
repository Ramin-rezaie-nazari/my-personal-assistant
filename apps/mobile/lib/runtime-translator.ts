import AsyncStorage from '@react-native-async-storage/async-storage';
import { onTranslateTask } from '../modules/expo-translate-text/src';
import type { AppLocale } from './languages';

const CACHE_PREFIX = '@my-personal-assistant/i18n-pack-v1:';
const memory = new Map<AppLocale, Record<string, string>>();
const pending = new Map<AppLocale, Promise<boolean>>();
const registeredCopies = new Set<Record<string, string>>();
let activeLocale: AppLocale = 'en';
let baseEnglish: Record<string, string> | null = null;

function targetCode(locale: AppLocale): string {
  switch (locale) {
    case 'zh': return 'zh';
    default: return locale;
  }
}

function isMeaningfulText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && /[\p{L}]/u.test(value);
}

async function patchGlobalTranslationPack(locale: AppLocale, pack: Record<string, string>): Promise<void> {
  const module = await import('./i18n');
  if (!baseEnglish) baseEnglish = { ...(module.translations.en as Record<string, string>) };
  if (locale === 'en') Object.assign(module.translations.en, baseEnglish);
  else if (locale !== 'fa') Object.assign(module.translations.en, pack);
}

export function getCachedTranslation(locale: AppLocale, key: string, fallback: string): string {
  return memory.get(locale)?.[key] ?? fallback;
}

export function registerCopy<T extends Record<string, string>>(source: T): T {
  registeredCopies.add(source);
  if (activeLocale !== 'en' && activeLocale !== 'fa') void translateCopy(source, activeLocale);
  return source;
}

export function getLocalizedCopy<T extends Record<string, string>>(locale: AppLocale, source: { en: T; fa: T }): T {
  if (locale === 'fa') return source.fa;
  if (locale === 'en') return source.en;
  const registered = registerCopy(source.en);
  const pack = memory.get(locale);
  return new Proxy(registered, {
    get(target, property: string | symbol) {
      if (typeof property === 'string' && pack?.[`copy:${property}`]) return pack[`copy:${property}`] as T[keyof T];
      return Reflect.get(target, property);
    },
  });
}

async function translateRecord(locale: AppLocale, source: Record<string, string>): Promise<Record<string, string> | null> {
  if (locale === 'en') return { ...source };
  const input: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) if (isMeaningfulText(value)) input[key] = value;
  try {
    const result = await onTranslateTask({ input, sourceLangCode: 'en', targetLangCode: targetCode(locale), requiresWifi: false, requireCharging: false });
    const translated = (result.translatedTexts ?? {}) as Record<string, unknown>;
    const pack: Record<string, string> = {};
    for (const key of Object.keys(source)) {
      const value = translated[key];
      pack[key] = typeof value === 'string' && value.trim() ? value : source[key];
    }
    return pack;
  } catch {
    return null;
  }
}

async function translateCopy(source: Record<string, string>, locale: AppLocale): Promise<boolean> {
  const pack = await translateRecord(locale, source);
  if (!pack) return false;
  const existing = memory.get(locale) ?? {};
  for (const [key, value] of Object.entries(pack)) existing[`copy:${key}`] = value;
  memory.set(locale, existing);
  return true;
}

export async function hydrateLocale(locale: AppLocale): Promise<boolean> {
  activeLocale = locale;
  if (locale === 'en') {
    if (baseEnglish) await patchGlobalTranslationPack(locale, baseEnglish);
    return true;
  }
  if (memory.has(locale)) {
    await patchGlobalTranslationPack(locale, memory.get(locale) ?? {});
    return true;
  }
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${locale}`);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pack: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) if (typeof value === 'string') pack[key] = value;
    memory.set(locale, pack);
    await patchGlobalTranslationPack(locale, pack);
    return Object.keys(pack).length > 0;
  } catch {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${locale}`);
    return false;
  }
}

export async function preloadRegisteredCopies(locale: AppLocale): Promise<void> {
  activeLocale = locale;
  if (locale === 'en' || locale === 'fa') return;
  await Promise.all([...registeredCopies].map((source) => translateCopy(source, locale)));
}

export async function preloadLocale(locale: AppLocale, sourcePack?: Record<string, string>): Promise<boolean> {
  activeLocale = locale;
  const i18n = await import('./i18n');
  const basePack = sourcePack ?? ({ ...(i18n.translations.en as Record<string, string>) });
  if (locale === 'en') {
    baseEnglish = { ...basePack };
    await patchGlobalTranslationPack(locale, baseEnglish);
    return true;
  }
  if (locale === 'fa') return true;
  const existing = pending.get(locale);
  if (existing) return existing;
  if (await hydrateLocale(locale)) {
    await preloadRegisteredCopies(locale);
    return true;
  }

  const work = (async () => {
    try {
      const pack = await translateRecord(locale, basePack);
      if (!pack) return false;
      memory.set(locale, pack);
      await AsyncStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(pack));
      await patchGlobalTranslationPack(locale, pack);
      await preloadRegisteredCopies(locale);
      return true;
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
  const translatedPack = await translateRecord(locale, { [cacheKey]: text });
  const translated = translatedPack?.[cacheKey] ?? text;
  const pack = memory.get(locale) ?? {};
  pack[cacheKey] = translated;
  memory.set(locale, pack);
  await AsyncStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(pack));
  return translated;
}
