import { Injectable } from '@nestjs/common';
import { ConversationHistoryService, PersistedConversationTurn } from './conversation-history.service';

export type ConversationTurn = PersistedConversationTurn;

export type ConversationContext = {
  turns: ConversationTurn[];
  lastUserMessage?: ConversationTurn;
  lastAssistantMessage?: ConversationTurn;
  lastAction?: { intent?: string; action?: string; executionId?: string };
};

@Injectable()
export class ConversationContextService {
  private readonly sessions = new Map<string, ConversationTurn[]>();
  private readonly maxTurns = 24;

  constructor(private readonly history: ConversationHistoryService) {}

  async append(turn: Omit<ConversationTurn, 'id' | 'createdAt'>): Promise<ConversationTurn> {
    const next = await this.history.append(turn);
    const turns = [...(this.sessions.get(turn.userId) ?? []), next].slice(-this.maxTurns);
    this.sessions.set(turn.userId, turns);
    return next;
  }

  async get(userId: string): Promise<ConversationContext> {
    const cached = this.sessions.get(userId);
    const turns = cached?.length ? [...cached] : await this.history.getRecent(userId, this.maxTurns);
    this.sessions.set(userId, turns.slice(-this.maxTurns));
    const reversed = [...turns].reverse();
    const lastActionTurn = reversed.find((turn) => Boolean(turn.action || turn.executionId));
    return {
      turns,
      lastUserMessage: reversed.find((turn) => turn.role === 'user'),
      lastAssistantMessage: reversed.find((turn) => turn.role === 'assistant'),
      lastAction: lastActionTurn
        ? { intent: lastActionTurn.intent, action: lastActionTurn.action, executionId: lastActionTurn.executionId }
        : undefined,
    };
  }

  async clear(userId: string) {
    this.sessions.delete(userId);
    return this.history.deleteAll(userId);
  }
}
