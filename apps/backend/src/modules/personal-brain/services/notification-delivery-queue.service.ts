import { Injectable } from '@nestjs/common';
import { ProactiveEvent } from './proactive-event-engine.service';
import { NotificationDecision } from './notification-orchestrator.service';

export type DeliveryStatus = 'queued' | 'delivered' | 'failed' | 'expired' | 'cancelled';
export type DeliveryJob = { id: string; event: ProactiveEvent; decision: NotificationDecision; status: DeliveryStatus; attempts: number; maxAttempts: number; expiresAt: string; createdAt: string; deliveredAt?: string; lastError?: string };

@Injectable()
export class NotificationDeliveryQueueService {
  private readonly jobs = new Map<string, DeliveryJob>();
  private sequence = 0;

  enqueue(event: ProactiveEvent, decision: NotificationDecision, now = new Date(), ttlMinutes = 30) {
    if (!decision.send) return null;
    const id = `notification-${++this.sequence}`;
    const job: DeliveryJob = { id, event, decision, status: 'queued', attempts: 0, maxAttempts: 3, expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(), createdAt: now.toISOString() };
    this.jobs.set(id, job);
    return job;
  }

  markDelivered(id: string, now = new Date()) {
    const job = this.jobs.get(id); if (!job) return null;
    job.status = 'delivered'; job.deliveredAt = now.toISOString(); return job;
  }

  markFailed(id: string, error: string, now = new Date()) {
    const job = this.jobs.get(id); if (!job) return null;
    job.attempts += 1; job.lastError = error;
    if (now >= new Date(job.expiresAt)) job.status = 'expired';
    else if (job.attempts >= job.maxAttempts) job.status = 'failed';
    else job.status = 'queued';
    return job;
  }

  expire(now = new Date()) {
    for (const job of this.jobs.values()) if (job.status === 'queued' && now >= new Date(job.expiresAt)) job.status = 'expired';
    return [...this.jobs.values()].filter(job => job.status === 'expired');
  }

  get(id: string) { return this.jobs.get(id); }
  listPending() { return [...this.jobs.values()].filter(job => job.status === 'queued'); }
}
