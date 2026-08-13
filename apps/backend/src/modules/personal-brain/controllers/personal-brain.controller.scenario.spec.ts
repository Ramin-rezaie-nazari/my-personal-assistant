import { PersonalBrainController } from './personal-brain.controller';

describe('PersonalBrainController scenario endpoint', () => {
  it('delegates scenario comparison to the scenario planning service', async () => {
    const compare = jest.fn().mockReturnValue({ scenarios: [], best: null });
    const controller = Object.create(PersonalBrainController.prototype) as any;
    controller.scenarioPlanningService = { compare };
    const body = { candidates: [], baseline: {}, context: {} };
    await controller.compareScenarios(body);
    expect(compare).toHaveBeenCalledWith(body);
  });
});
