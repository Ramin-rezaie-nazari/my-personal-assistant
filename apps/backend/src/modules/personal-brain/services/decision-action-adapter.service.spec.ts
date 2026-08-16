import { DecisionActionAdapterService } from './decision-action-adapter.service';

describe('DecisionActionAdapterService', () => {
  const candidate = {
    id: 'd1',
    domain: 'workout' as const,
    action: 'start',
    score: 1,
    confidence: 1,
  };

  it('dispatches to the first adapter that supports the action', async () => {
    const service = new DecisionActionAdapterService();
    service.register({
      supports: (item) => item.action === 'start',
      execute: async () => ({ started: true }),
    });
    await expect(service.execute(candidate)).resolves.toEqual({
      handled: true,
      status: 'executed',
      action: 'start',
      result: { started: true },
    });
  });

  it('returns unsupported without throwing when no adapter exists', async () => {
    const service = new DecisionActionAdapterService();
    await expect(service.execute(candidate)).resolves.toEqual({
      handled: false,
      status: 'unsupported',
      action: 'start',
    });
  });
});
