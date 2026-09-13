import { Injectable } from '@nestjs/common';
import { ConversationLanguage, ConversationStyle } from '../types';

@Injectable()
export class ConversationStyleService {
  getDefaultStyle(language: ConversationLanguage = 'en'): ConversationStyle {
    return {
      tone: 'friendly',
      language,
      formality: 'informal',
    };
  }
}
