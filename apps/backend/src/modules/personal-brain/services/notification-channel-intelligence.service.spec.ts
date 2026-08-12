import { NotificationChannelIntelligenceService } from './notification-channel-intelligence.service';

describe('NotificationChannelIntelligenceService', () => {
  const service = new NotificationChannelIntelligenceService();

  it('ranks channels by engagement quality', () => {
    const result = service.choose([
      { channel: 'push', delivered: 100, opened: 70, completed: 50, dismissed: 5, snoozed: 5 },
      { channel: 'in_app', delivered: 100, opened: 30, completed: 10, dismissed: 20, snoozed: 10 },
    ], ['push', 'in_app']);
    expect(result.primary).toBe('push');
  });

  it('does not overfit a channel with no history', () => {
    const result = service.choose([], ['push', 'in_app']);
    expect(result.ranked).toHaveLength(2);
    expect(result.ranked[0].score).toBe(0.5);
  });
});
