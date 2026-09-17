import type { AppLocale } from './i18n';
import { getLocalizedCopy } from './runtime-translator';

export function localizedCopy<T extends Record<string, string>>(copy: { en: T; fa: T }): Record<AppLocale, T> {
  return new Proxy(copy as Record<AppLocale, T>, {
    get(target, property: string | symbol) {
      if (property === 'fa') return copy.fa;
      if (typeof property === 'string' && property !== 'en') return getLocalizedCopy(property as AppLocale, copy);
      return copy.en;
    },
  });
}
