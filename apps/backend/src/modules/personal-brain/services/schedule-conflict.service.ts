import { Injectable } from '@nestjs/common';
import { ScheduleItem } from './full-day-scheduler.service';

@Injectable()
export class ScheduleConflictService {
  validate(items: ScheduleItem[]) {
    const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
    const conflicts: Array<{ firstId: string; secondId: string; firstTitle: string; secondTitle: string }> = [];
    for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) {
      if (new Date(sorted[j].start) >= new Date(sorted[i].end)) break;
      if (new Date(sorted[i].start) < new Date(sorted[j].end) && new Date(sorted[j].start) < new Date(sorted[i].end)) conflicts.push({ firstId: sorted[i].id, secondId: sorted[j].id, firstTitle: sorted[i].title, secondTitle: sorted[j].title });
    }
    return { conflictFree: conflicts.length === 0, count: conflicts.length, conflicts };
  }
}
