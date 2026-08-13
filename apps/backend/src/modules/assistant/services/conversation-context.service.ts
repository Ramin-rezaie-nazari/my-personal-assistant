import { Injectable, Optional } from '@nestjs/common';
import { ConversationHistoryService, PersistedConversationTurn } from './conversation-history.service';

export type ConversationTurn = PersistedConversationTurn;
export type ConversationContext = { turns: ConversationTurn[]; lastUserMessage?: ConversationTurn; lastAssistantMessage?: ConversationTurn; lastAction?: { intent?: string; action?: string; executionId?: string; resourceType?: string; resourceId?: string } };

@Injectable()
export class ConversationContextService {
  private readonly sessions = new Map<string, ConversationTurn[]>();
  private readonly maxTurns = 24;
  private sequence = 0;
  constructor(@Optional() private readonly history?: ConversationHistoryService) {}

  append(turn: Omit<ConversationTurn, 'id' | 'createdAt'>): ConversationTurn {
    const next: ConversationTurn = this.history ? ({ ...turn, id: `memory-${++this.sequence}`, createdAt: Date.now() } as ConversationTurn) : ({ ...turn, id: `memory-${++this.sequence}`, createdAt: Date.now() } as ConversationTurn);
    const turns = [...(this.sessions.get(turn.userId) ?? []), next].slice(-this.maxTurns);
    this.sessions.set(turn.userId, turns);
    if (this.history) void this.history.append(turn).catch(() => undefined);
    return next;
  }

  get(userId: string): ConversationContext {
    const turns = [...(this.sessions.get(userId) ?? [])].slice(-this.maxTurns);
    const reversed = [...turns].reverse();
    const lastActionTurn = reversed.find((turn) => Boolean(turn.action || turn.executionId || turn.resourceId));
    return { turns, lastUserMessage: reversed.find((turn) => turn.role === 'user'), lastAssistantMessage: reversed.find((turn) => turn.role === 'assistant'), lastAction: lastActionTurn ? { intent: lastActionTurn.intent, action: lastActionTurn.action, executionId: lastActionTurn.executionId, resourceType: lastActionTurn.resourceType, resourceId: lastActionTurn.resourceId } : undefined };
  }

  clear(userId: string) { this.sessions.delete(userId); if (this.history) void this.history.deleteAll(userId).catch(() => undefined); }
}
