import { getLanguage, isRTL, LANGUAGE_OPTIONS, SUPPORTED_LANGUAGE_COUNT, SUPPORTED_LANGUAGES } from './languages';
import { getVoiceLanguage } from './voice-language';

describe('global language contract', () => {
  it('keeps exactly 51 base languages', () => {
    expect(SUPPORTED_LANGUAGE_COUNT).toBe(51);
    expect(SUPPORTED_LANGUAGES).toHaveLength(51);
    expect(new Set(SUPPORTED_LANGUAGES.map((language) => language.code)).size).toBe(51);
  });

  it('keeps Iranian Azerbaijani Turkish distinct from Turkish (Türkiye)', () => {
    expect(LANGUAGE_OPTIONS.some((language) => language.code === 'az')).toBe(true);
    expect(LANGUAGE_OPTIONS.some((language) => language.code === 'tr')).toBe(true);
    expect(getLanguage('az').englishName).toContain('Iran');
    expect(getLanguage('tr').englishName).toContain('Türkiye');
  });

  it('routes every selectable locale to a dedicated voice tag', () => {
    for (const language of LANGUAGE_OPTIONS) {
      const voice = getVoiceLanguage(language.code);
      expect(voice.code).toBeTruthy();
      expect(voice.code).toContain('-');
    }
  });

  it('marks all RTL selections consistently', () => {
    expect(isRTL('fa')).toBe(true);
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('ur')).toBe(true);
    expect(isRTL('tr')).toBe(false);
    expect(isRTL('az')).toBe(false);
  });
});
