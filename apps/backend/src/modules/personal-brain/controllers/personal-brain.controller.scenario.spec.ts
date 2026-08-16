import { PersonalBrainController } from './personal-brain.controller';

describe('PersonalBrainController scenario endpoint', () => {
  it('delegates scenario comparison to the scenario planning service', async () => {
    const scenario = { compare: jest.fn().mockReturnValue({ scenarios: [], best: null }) };
    const deps = Array.from({ length: 24 }, () => ({} as any));
    const controller = new PersonalBrainController(...deps, scenario as any);
    const body = { candidates: [], baseline: {}, context: {} };
    await controller.compareScenarios(body);
    expect(scenario.compare).toHaveBeenCalledWith(body);
  });
});
