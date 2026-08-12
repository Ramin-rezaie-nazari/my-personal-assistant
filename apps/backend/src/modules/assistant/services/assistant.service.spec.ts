import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';

import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  it('returns the assistant status', async () => {
    const orchestrator = {} as BrainOrchestratorService;
    const service = new AssistantService(orchestrator);

    await expect(service.getStatus()).resolves.toEqual({
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    });
  });

  it('delegates assistant requests to the brain orchestrator with the user id', async () => {
    const processRequest = jest.fn().mockResolvedValue({
      message: 'ok',
      intent: 'general',
      confidence: 1,
      nextAction: 'respond',
    });

    const orchestrator = {
      processRequest,
    } as unknown as BrainOrchestratorService;

    const service = new AssistantService(orchestrator);

    await expect(service.process('hello', 'user-123')).resolves.toEqual({
      message: 'ok',
      intent: 'general',
      confidence: 1,
      nextAction: 'respond',
    });

    expect(processRequest).toHaveBeenCalledTimes(1);
    expect(processRequest).toHaveBeenCalledWith('hello', 'user-123');
  });
});
