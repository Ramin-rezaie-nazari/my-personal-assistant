import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';

export type DecisionActionResult = { handled: boolean; status: 'executed' | 'unsupported'; action: string; result?: unknown };

export interface DecisionActionAdapter {
  supports(candidate: DecisionCandidate): boolean;
  execute(candidate: DecisionCandidate, context: Record<string, unknown>): Promise<unknown> | unknown;
}

@Injectable()
export class DecisionActionAdapterService {
  private readonly adapters: DecisionActionAdapter[] = [];

  register(adapter: DecisionActionAdapter) {
    this.adapters.push(adapter);
    return this;
  }

  supports(candidate: DecisionCandidate): boolean {
    return this.adapters.some((adapter) => adapter.supports(candidate));
  }

  getSupportedActions(): string[] {
    return Array.from(new Set(this.adapters.flatMap((adapter) => this.getAdapterActions(adapter)))).sort();
  }

  async execute(candidate: DecisionCandidate, context: Record<string, unknown> = {}): Promise<DecisionActionResult> {
    const adapter = this.adapters.find((item) => item.supports(candidate));
    if (!adapter) return { handled: false, status: 'unsupported', action: candidate.action };
    const result = await adapter.execute(candidate, context);
    return { handled: true, status: 'executed', action: candidate.action, result };
  }

  private getAdapterActions(adapter: DecisionActionAdapter): string[] {
    const advertised = (adapter as DecisionActionAdapter & { actions?: unknown }).actions;
    if (!Array.isArray(advertised)) return [];
    return advertised.filter((action): action is string => typeof action === 'string' && action.length > 0);
  }
}
