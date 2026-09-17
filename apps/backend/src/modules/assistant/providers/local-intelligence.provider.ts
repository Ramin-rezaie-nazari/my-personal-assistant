import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../services/ai-provider.types';
import { LocalLanguageUnderstandingService } from '../services/local-language-understanding.service';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';

  constructor(private readonly language: LocalLanguageUnderstandingService) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const understanding = this.language.understand(request.input);
    const food = understanding.entities.food;

    switch (understanding.intent) {
      case 'ADD_TO_BASKET':
        return { providerId: this.id, text: food ? `Okay, I’ll add ${food} to your shopping basket.` : 'Okay, I’ll prepare that item for your shopping basket.' };
      case 'REMOVE_FROM_BASKET':
        return { providerId: this.id, text: food ? `Okay, I’ll remove ${food} from your shopping basket.` : 'Okay, I’ll remove that item from your shopping basket.' };
      case 'RECOMMEND_MEAL':
        return { providerId: this.id, text: 'Absolutely. I’ll check your home inventory and nutrition plan to find a suitable option.' };
      case 'GET_NUTRITION_SUMMARY':
        return { providerId: this.id, text: 'Okay, I’ll check the nutrition summary from the data you have logged today.' };
      case 'CREATE_REMINDER':
        return { providerId: this.id, text: 'Absolutely. I’ll prepare the reminder and use the requested time when available.' };
      case 'UPDATE_REQUEST':
        return { providerId: this.id, text: 'Okay, I’ll update the previous request with your new change.' };
      case 'CANCEL_REQUEST':
        return { providerId: this.id, text: 'Okay, I’ll cancel the previous request.' };
      default:
        return { providerId: this.id, text: 'I understood that you need help, but I need a little more information to perform the right action.' };
    }
  }
}
