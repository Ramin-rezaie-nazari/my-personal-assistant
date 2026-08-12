import { Injectable } from '@nestjs/common';
import { ConversationContextService } from './conversation-context.service';

export type ContextualCommand = {
  text: string;
  referencesPrevious: boolean;
  operation: 'create' | 'update' | 'cancel' | 'unknown';
  targetAction?: string;
  targetExecutionId?: string;
  targetResourceType?: string;
  targetResourceId?: string;
};

@Injectable()
export class ContextualCommandService {
  constructor(private readonly context: ConversationContextService) {}

  async resolve(userId: string, text: string): Promise<ContextualCommand> {
    const normalized = text.trim().toLowerCase();
    const previous = (await this.context.get(userId)).lastAction;
    const referencesPrevious = /\b(that|it|this|same|previous|earlier)\b|همون|این|قبلی|اون|دوباره/.test(normalized);
    const operation: ContextualCommand['operation'] =
      /\b(change|edit|move|update|make it|instead)\b|تغییر|ویرایش|جابجا|بذار/.test(normalized)
        ? 'update'
        : /\b(cancel|delete|remove)\b|لغو|حذف/.test(normalized)
          ? 'cancel'
          : /\b(remind|schedule|create|add)\b|یادم بنداز|قرار بده|اضافه/.test(normalized)
            ? 'create'
            : 'unknown';

    return {
      text,
      referencesPrevious,
      operation,
      targetAction: referencesPrevious ? previous?.action : undefined,
      targetExecutionId: referencesPrevious ? previous?.executionId : undefined,
      targetResourceType: referencesPrevious ? previous?.resourceType : undefined,
      targetResourceId: referencesPrevious ? previous?.resourceId : undefined,
    };
  }
}
