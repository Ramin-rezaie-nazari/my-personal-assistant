import { ActionConfirmationIntelligenceService } from './action-confirmation-intelligence.service';

describe('ActionConfirmationIntelligenceService', () => {
  const candidate = {
    id: 'd1',
    domain: 'reminder',
    action: 'delete_reminder',
    score: 1,
    confidence: 1,
    source: 'test',
  } as any;

  it('requires confirmation for destructive actions', () => {
    const service = new ActionConfirmationIntelligenceService();
    const result = service.assess('u1', candidate, {}, 1000);
    expect(result.required).toBe(true);
    expect(result.token).toBeDefined();
  });

  it('consumes a pending action only for the same user', () => {
    const service = new ActionConfirmationIntelligenceService();
    const pending = service.assess('u1', candidate, { foo: 'bar' }, 1000);
    expect(service.consume('u2', pending.token!, 1001)).toBeUndefined();
    expect(service.consume('u1', pending.token!, 1001)).toMatchObject({
      userId: 'u1',
      candidate,
    });
    expect(service.consume('u1', pending.token!, 1002)).toBeUndefined();
  });

  it('expires pending confirmations', () => {
    const service = new ActionConfirmationIntelligenceService();
    const pending = service.assess('u1', candidate, {}, 1000);
    expect(service.consume('u1', pending.token!, 301001)).toBeUndefined();
  });
});
