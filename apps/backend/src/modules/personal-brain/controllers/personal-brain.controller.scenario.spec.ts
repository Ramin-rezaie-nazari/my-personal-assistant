import { PersonalBrainController } from './personal-brain.controller';
describe('PersonalBrainController scenario endpoint', () => {
  it('delegates scenario comparison to the scenario planning service', async () => {
    const scenario = { compare: jest.fn().mockReturnValue({ scenarios: [], best: null }) };
    const controller = new PersonalBrainController(
      ...Array.from({ length: 24 }, () => ({} as any)),
      scenario as any,
      {} as any,
      {} as any,
    );
    const body = { candidates: [], baseline: {}, context: {} };
    await controller.compareScenarios(body);
    expect(scenario.compare).toHaveBeenCalledWith(body);
  });
});
