import { GlobalizationContextService } from './globalization-context.service';
import { VoiceLanguageService } from './voice-language.service';
import { VoiceContextService } from './voice-context.service';

describe('VoiceContextService', () => {
  const service = new VoiceContextService(
    new GlobalizationContextService(),
    new VoiceLanguageService(),
  );

  it('derives the voice from the globalization locale', () => {
    const result = service.resolve({ languageTag: 'fa-IR', countryCode: 'IR' });

    expect(result.profile.id).toBe('fa-IR');
    expect(result.inputLanguage).toBe('fa');
    expect(result.synthesisLanguage).toBe('fa');
    expect(result.accent).toBe('tehran');
    expect(result.direction).toBe('rtl');
  });

  it('allows an explicit voice profile override', () => {
    const result = service.resolve({
      languageTag: 'en-US',
      countryCode: 'US',
      voiceId: 'en-GB',
    });

    expect(result.profile.id).toBe('en-GB');
    expect(result.locale.languageTag).toBe('en-US');
  });

  it('falls back safely for an unsupported voice request', () => {
    const result = service.resolve({
      languageTag: 'es-MX',
      countryCode: 'MX',
      voiceId: 'unknown-voice',
    });

    expect(result.profile.id).toBe('en-US');
    expect(result.locale.languageTag).toBe('es-MX');
  });
});
