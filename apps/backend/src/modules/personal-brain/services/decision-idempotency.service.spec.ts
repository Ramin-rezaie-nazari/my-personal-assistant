import { DecisionIdempotencyService } from './decision-idempotency.service';

describe('DecisionIdempotencyService', () => {
  it('remembers and returns a previous execution result', () => {
    const service = new DecisionIdempotencyService();
    service.remember('d1', { ok: true });
    expect(service.has('d1')).toBe(true);
    expect(service.get('d1')).toEqual({ ok: true });
  });

  it('expires remembered results', () => {
    const service = new DecisionIdempotencyService();
    service.remember('d2', 'done', 1);
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(service.has('d2')).toBe(false);
        resolve();
      }, 5),
    );
  });
});
