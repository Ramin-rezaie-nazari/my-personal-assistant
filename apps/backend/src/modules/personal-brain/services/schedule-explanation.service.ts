import { Injectable } from '@nestjs/common';
import { ScheduleItem } from './full-day-scheduler.service';

@Injectable()
export class ScheduleExplanationService {
  explain(
    item: ScheduleItem,
    context: {
      adaptiveMatch?: boolean;
      deadlinePressure?: boolean;
      conflictAvoided?: boolean;
    } = {},
  ) {
    const reasons = [item.reason];
    if (context.adaptiveMatch) reasons.push('matches learned user behavior');
    if (context.deadlinePressure) reasons.push('deadline increases urgency');
    if (context.conflictAvoided) reasons.push('placed in a conflict-free slot');
    return { id: item.id, title: item.title, why: [...new Set(reasons)] };
  }
}
