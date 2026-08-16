import { NotificationExperimentService } from './notification-experiment.service';

describe('NotificationExperimentService', () => {
  it('explores every arm once before exploiting', () => {
    const service = new NotificationExperimentService();
    const arms = [
      { id: 'a', label: 'early' },
      { id: 'b', label: 'late' },
    ];
    const first = service.choose('exp1', arms);
    service.observe('exp1', { armId: first.armId, success: true });
    const second = service.choose('exp1', arms);
    expect(second.exploration).toBe(true);
    expect(second.armId).not.toBe(first.armId);
  });

  it('exploits the best observed arm after exploration', () => {
    const service = new NotificationExperimentService();
    const arms = [
      { id: 'a', label: 'early' },
      { id: 'b', label: 'late' },
    ];
    service.observe('exp2', { armId: 'a', success: true });
    service.observe('exp2', { armId: 'a', success: true });
    service.observe('exp2', { armId: 'b', success: false });
    const result = service.choose('exp2', arms, 0);
    expect(result.armId).toBe('a');
    expect(result.exploration).toBe(false);
  });
});
