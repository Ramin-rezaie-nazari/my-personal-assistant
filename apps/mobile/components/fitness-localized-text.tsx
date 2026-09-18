import { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';
import { type AppLocale } from '../lib/i18n';
import { translateDynamicText } from '../lib/runtime-translator';

export function FitnessLocalizedText({ en, fa, locale, style }: { en: string; fa?: string | null; locale: AppLocale; style?: TextStyle }) {
  const [value, setValue] = useState(() => locale === 'fa' && fa ? fa : en);
  useEffect(() => {
    let active = true;
    if (locale === 'en') { setValue(en); return () => { active = false; }; }
    if (locale === 'fa' && fa) { setValue(fa); return () => { active = false; }; }
    if (!en.trim()) { setValue(''); return () => { active = false; }; }
    setValue('…');
    void translateDynamicText(locale, en).then((translated) => { if (active) setValue(translated); }).catch(() => { if (active) setValue(en); });
    return () => { active = false; };
  }, [en, fa, locale]);
  return <Text style={style}>{value}</Text>;
}
