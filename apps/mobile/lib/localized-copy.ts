import type { AppLocale } from './i18n';

/**
 * Adapts an existing en/fa copy pack to the canonical 51-locale type.
 * Non-en/fa locales temporarily use the English pack until their full
 * translation pack is generated, while keeping all locale consumers type-safe.
 */
export function localizedCopy<T>(copy: { en: T; fa: T }): Record<AppLocale, T> {
  return new Proxy(copy as Record<AppLocale, T>, {
    get(target, property: string | symbol) {
      if (property === 'fa') return copy.fa;
      return copy.en;
    },
  });
}
