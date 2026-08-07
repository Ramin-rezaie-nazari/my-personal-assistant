import { Injectable } from '@nestjs/common';

import { ConversationStyle } from '../types';

@Injectable()
export class ConversationStyleService {
  getDefaultStyle(): ConversationStyle {
    return {
      tone: 'friendly',
      language: 'fa',
      formality: 'informal',
    };
  }
}
