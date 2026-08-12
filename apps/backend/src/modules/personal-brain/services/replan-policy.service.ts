import { Injectable } from '@nestjs/common';
import { ScheduleHealthService } from './schedule-health.service';

@Injectable()
export class ReplanPolicyService {
  constructor(private readonly health: ScheduleHealthService) {}

  async decide(userId: string, date = new Date()) {
    const health = await this.health.evaluate(userId, date);
    const shouldReplan = health.status !== 'healthy' || health.issues.overlaps > 0 || health.issues.unscheduled > 0;
    return { shouldReplan, urgency: health.status === 'overloaded' ? 'high' : shouldReplan ? 'medium' : 'none', reasons: [...(health.issues.overlaps ? ['schedule conflict'] : []), ...(health.issues.unscheduled ? ['items could not fit'] : []), ...(health.status === 'overloaded' ? ['focus capacity exceeded'] : [])], health };
  }
}
