import AsyncStorage from '@react-native-async-storage/async-storage';
import { onTranslateTask } from '../modules/expo-translate-text/src';
import { getTranslationLocaleCode, type AppLocale } from './languages';
import { iranianAzerbaijaniToTurkish, turkishToIranianAzerbaijani } from './az-language-bridge';

const CACHE_PREFIX = '@my-personal-assistant/i18n-pack-v1:';
const memory = new Map<AppLocale, Record<string, string>>();
const pending = new Map<AppLocale, Promise<boolean>>();
const registeredCopies = new Set<Record<string, string>>();
const listeners = new Set<() => void>();
let activeLocale: AppLocale = 'en';
let baseEnglish: Record<string, string> | null = null;

function targetCode(locale: AppLocale): string {
  return getTranslationLocaleCode(locale);
}

function isMeaningfulText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && /[\p{L}]/u.test(value);
}

function emitTranslationRevision(): void {
  for (const listener of listeners) {
    try { listener(); } catch { /* subscribers must never break translation */ }
  }
}

export function subscribeTranslationRevision(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function getBaseEnglishPack(): Promise<Record<string, string>> {
  const module = await import('./i18n');
  if (!baseEnglish) baseEnglish = { ...(module.translations.en as Record<string, string>) };
  return { ...baseEnglish };
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
  return new Proxy(registered, {
    get(target, property: string | symbol) {
      if (typeof property === 'string') {
        const pack = memory.get(locale);
        if (pack?.[`copy:${property}`]) return pack[`copy:${property}`] as T[keyof T];
        return '…' as T[keyof T];
      }
      return Reflect.get(target, property);
    },
  });
}

async function translateRecordNative(sourceLangCode: string, targetLangCode: string, source: Record<string, string>): Promise<Record<string, string> | null> {
  if (sourceLangCode === targetLangCode) return { ...source };
  const input: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) if (isMeaningfulText(value)) input[key] = value;
  try {
    const result = await onTranslateTask({ input, sourceLangCode, targetLangCode, requiresWifi: false, requireCharging: false });
    const translated = (result.translatedTexts ?? {}) as Record<string, unknown>;
    const pack: Record<string, string> = {};
    for (const key of Object.keys(source)) {
      const value = translated[key];
      if (typeof value !== 'string' || !value.trim()) return null;
      pack[key] = value;
    }
    return pack;
  } catch {
    return null;
  }
}

/**
 * Google ML Kit does not currently expose Azerbaijani as a translation target/source.
 * `az` therefore uses a regional compatibility bridge through Turkish, then applies
 * deterministic Iranian-Azerbaijani lexical normalization. This preserves `az` as a
 * separate product locale while keeping the app functional without a second business-logic stack.
 * A dedicated Azerbaijani MT provider can replace this bridge later without changing callers.
 */
async function translateRecord(sourceLangCode: string, targetLangCode: string, source: Record<string, string>): Promise<Record<string, string> | null> {
  if (sourceLangCode === targetLangCode) return { ...source };

  if (targetLangCode === 'az') {
    const viaTurkish = await translateRecordNative(sourceLangCode, 'tr', source);
    if (!viaTurkish) return null;
    return Object.fromEntries(Object.entries(viaTurkish).map(([key, value]) => [key, turkishToIranianAzerbaijani(value)]));
  }

  if (sourceLangCode === 'az') {
    const normalizedTurkish = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, iranianAzerbaijaniToTurkish(value)]));
    return translateRecordNative('tr', targetLangCode, normalizedTurkish);
  }

  return translateRecordNative(sourceLangCode, targetLangCode, source);
}

async function translateCopy(source: Record<string, string>, locale: AppLocale): Promise<boolean> {
  const pack = await translateRecord('en', targetCode(locale), source);
  if (!pack) return false;
  const existing = memory.get(locale) ?? {};
  for (const [key, value] of Object.entries(pack)) existing[`copy:${key}`] = value;
  memory.set(locale, existing);
  emitTranslationRevision();
  return true;
}

export async function hydrateLocale(locale: AppLocale): Promise<boolean> {
  activeLocale = locale;
  if (locale === 'en') {
    if (baseEnglish) await patchGlobalTranslationPack(locale, baseEnglish);
    emitTranslationRevision();
    return true;
  }
  if (memory.has(locale)) {
    await patchGlobalTranslationPack(locale, memory.get(locale) ?? {});
    emitTranslationRevision();
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
    emitTranslationRevision();
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
  const basePack = sourcePack ?? await getBaseEnglishPack();
  if (locale === 'en') {
    baseEnglish = { ...basePack };
    await patchGlobalTranslationPack(locale, baseEnglish);
    emitTranslationRevision();
    return true;
  }
  if (locale === 'fa') {
    emitTranslationRevision();
    return true;
  }
  const existing = pending.get(locale);
  if (existing) return existing;
  if (await hydrateLocale(locale)) {
    await preloadRegisteredCopies(locale);
    return true;
  }

  const work = (async () => {
    try {
      const pack = await translateRecord('en', targetCode(locale), basePack);
      if (!pack) return false;
      memory.set(locale, pack);
      await AsyncStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(pack));
      await patchGlobalTranslationPack(locale, pack);
      emitTranslationRevision();
      await preloadRegisteredCopies(locale);
      return true;
    } finally {
      pending.delete(locale);
    }
  })();
  pending.set(locale, work);
  return work;
}

export async function translateTextBetweenLocales(text: string, sourceLocale: AppLocale, targetLocale: AppLocale): Promise<string> {
  const normalized = text.trim();
  if (!normalized || sourceLocale === targetLocale) return text;
  const cacheKey = `bridge:${sourceLocale}->${targetLocale}:${normalized}`;
  const cached = getCachedTranslation(targetLocale, cacheKey, '');
  if (cached) return cached;

  const translatedPack = await translateRecord(targetCode(sourceLocale), targetCode(targetLocale), { [cacheKey]: normalized });
  const translated = translatedPack?.[cacheKey];
  if (!translated) throw new Error(`Translation unavailable for ${sourceLocale} → ${targetLocale}`);
  const pack = memory.get(targetLocale) ?? {};
  pack[cacheKey] = translated;
  memory.set(targetLocale, pack);
  await AsyncStorage.setItem(`${CACHE_PREFIX}${targetLocale}`, JSON.stringify(pack));
  emitTranslationRevision();
  return translated;
}

export async function translateDynamicText(locale: AppLocale, text: string): Promise<string> {
  return translateTextBetweenLocales(text, 'en', locale);
}
