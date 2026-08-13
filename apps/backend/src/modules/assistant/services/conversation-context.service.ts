import { Injectable, Optional } from '@nestjs/common';
import { ConversationHistoryService, PersistedConversationTurn } from './conversation-history.service';

export type ConversationTurn = PersistedConversationTurn;
export type ConversationContext = {
  turns: ConversationTurn[];
  lastUserMessage?: ConversationTurn;
  lastAssistantMessage?: ConversationTurn;
  lastAction?: { intent?: string; action?: string; executionId?: string; resourceType?: string; resourceId?: string };
};

@Injectable()
export class ConversationContextService {
  private readonly sessions = new Map<string, ConversationTurn[]>();
  private readonly maxTurns = 24;
  private sequence = 0;

  constructor(@Optional() private readonly history?: ConversationHistoryService) {}

  async append(turn: Omit<ConversationTurn, 'id' | 'createdAt'>): Promise<ConversationTurn> {
    const next = this.history
      ? await this.history.append(turn)
      : { ...turn, id: `memory-${++this.sequence}`, createdAt: new Date() } as ConversationTurn;
    const turns = [...(this.sessions.get(turn.userId) ?? []), next].slice(-this.maxTurns);
    this.sessions.set(turn.userId, turns);
    return next;
  }

  async get(userId: string): Promise<ConversationContext> {
    const cached = this.sessions.get(userId);
    const turns = cached?.length ? [...cached] : this.history ? await this.history.getRecent(userId, this.maxTurns) : [];
    this.sessions.set(userId, turns.slice(-this.maxTurns));
    const reversed = [...turns].reverse();
    const lastActionTurn = reversed.find((turn) => Boolean(turn.action || turn.executionId || turn.resourceId));
    return {
      turns,
      lastUserMessage: reversed.find((turn) => turn.role === 'user'),
      lastAssistantMessage: reversed.find((turn) => turn.role === 'assistant'),
      lastAction: lastActionTurn ? { intent: lastActionTurn.intent, action: lastActionTurn.action, executionId: lastActionTurn.executionId, resourceType: lastActionTurn.resourceType, resourceId: lastActionTurn.resourceId } : undefined,
    };
  }

  async clear(userId: string) {
    this.sessions.delete(userId);
    return this.history ? this.history.deleteAll(userId) : undefined;
  }
}
