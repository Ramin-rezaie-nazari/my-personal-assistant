import { Injectable } from '@nestjs/common';
import {
  DecisionCandidate,
  UnifiedDecision,
} from './unified-decision-engine.service';

export type ExecutionStep = {
  order: number;
  candidateId: string;
  domain: DecisionCandidate['domain'];
  action: string;
  dependsOn: string[];
};

@Injectable()
export class DecisionExecutionPlannerService {
  plan(result: UnifiedDecision): ExecutionStep[] {
    const selected = result.selected;
    const steps: ExecutionStep[] = [];
    const completed: string[] = [];
    const priority = new Map<DecisionCandidate['domain'], number>([
      ['schedule', 10],
      ['reminder', 20],
      ['nutrition', 30],
      ['workout', 40],
      ['habit', 50],
      ['notification', 60],
      ['conversation', 70],
    ]);
    const ordered = [...selected].sort(
      (a, b) =>
        (priority.get(a.domain) ?? 100) - (priority.get(b.domain) ?? 100),
    );
    ordered.forEach((candidate, index) => {
      const dependsOn = index === 0 ? [] : [...completed];
      steps.push({
        order: index + 1,
        candidateId: candidate.id,
        domain: candidate.domain,
        action: candidate.action,
        dependsOn,
      });
      completed.push(candidate.id);
    });
    return steps;
  }
}
