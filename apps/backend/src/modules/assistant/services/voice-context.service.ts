import { Injectable } from '@nestjs/common';

import {
  GlobalizationContext,
  GlobalizationContextService,
} from './globalization-context.service';
import {
  VoiceLanguageProfile,
  VoiceLanguageService,
} from './voice-language.service';

export type VoiceContext = Readonly<{
  profile: VoiceLanguageProfile;
  locale: GlobalizationContext;
  inputLanguage: string;
  synthesisLanguage: string;
  accent: string;
  direction: 'ltr' | 'rtl';
}>;

@Injectable()
export class VoiceContextService {
  constructor(
    private readonly globalization: GlobalizationContextService,
    private readonly voices: VoiceLanguageService,
  ) {}

  resolve(request: {
    languageTag?: string;
    countryCode?: string;
    voiceId?: string;
  } = {}): VoiceContext {
    const locale = this.globalization.resolve({
      languageTag: request.languageTag,
      countryCode: request.countryCode,
    });

    const preferred = request.voiceId ?? locale.languageTag;
    const profile = this.voices.get(preferred);

    return {
      profile,
      locale,
      inputLanguage: profile.languageCode,
      synthesisLanguage: profile.languageCode,
      accent: profile.accent,
      direction: profile.direction,
    };
  }
}
