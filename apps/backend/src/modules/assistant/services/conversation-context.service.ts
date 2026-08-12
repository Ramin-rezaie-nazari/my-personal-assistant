import { Injectable } from '@nestjs/common';

export type ConversationTurn = {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  intent?: string;
  action?: string;
  executionId?: string;
};

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

  append(turn: Omit<ConversationTurn, 'id' | 'createdAt'>): ConversationTurn {
    const next: ConversationTurn = { ...turn, id: `${turn.userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() };
    const turns = [...(this.sessions.get(turn.userId) ?? []), next].slice(-this.maxTurns);
    this.sessions.set(turn.userId, turns);
    return next;
  }

  get(userId: string): ConversationContext {
    const turns = [...(this.sessions.get(userId) ?? [])];
    return {
      turns,
      lastUserMessage: [...turns].reverse().find((turn) => turn.role === 'user'),
      lastAssistantMessage: [...turns].reverse().find((turn) => turn.role === 'assistant'),
      lastAction: [...turns].reverse().find((turn) => turn.action)?.
        ? (() => { const turn = [...turns].reverse().find((item) => item.action); return turn ? { intent: turn.intent, action: turn.action, executionId: turn.executionId } : undefined; })()
        : undefined,
    };
  }

  clear(userId: string) {
    this.sessions.delete(userId);
  }
}
