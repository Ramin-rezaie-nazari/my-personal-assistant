import { ReplanPolicyService } from './replan-policy.service';

describe('ReplanPolicyService', () => {
  it('requests high urgency replanning when capacity is overloaded', async () => {
    const health = { evaluate: jest.fn().mockResolvedValue({ status: 'overloaded', issues: { overlaps: 1, unscheduled: 2 } }) };
    const service = new ReplanPolicyService(health as any);
    await expect(service.decide('user-1')).resolves.toMatchObject({ shouldReplan: true, urgency: 'high', reasons: ['schedule conflict', 'items could not fit', 'focus capacity exceeded'] });
  });
  it('does not request replanning for a healthy schedule', async () => {
    const health = { evaluate: jest.fn().mockResolvedValue({ status: 'healthy', issues: { overlaps: 0, unscheduled: 0 } }) };
    const service = new ReplanPolicyService(health as any);
    await expect(service.decide('user-1')).resolves.toMatchObject({ shouldReplan: false, urgency: 'none', reasons: [] });
  });
});
