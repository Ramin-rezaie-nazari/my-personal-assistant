import { DecisionExecutionStateService } from './decision-execution-state.service';

describe('DecisionExecutionStateService', () => {
  it('tracks the execution lifecycle', () => {
    const service = new DecisionExecutionStateService();
    expect(service.start('d1').state).toBe('running');
    expect(service.complete('d1').state).toBe('completed');
    expect(service.get('d1')?.state).toBe('completed');
  });

  it('records failures and cancellation', () => {
    const service = new DecisionExecutionStateService();
    expect(service.fail('d2', 'provider unavailable').error).toBe(
      'provider unavailable',
    );
    expect(service.cancel('d3').state).toBe('cancelled');
  });
});
