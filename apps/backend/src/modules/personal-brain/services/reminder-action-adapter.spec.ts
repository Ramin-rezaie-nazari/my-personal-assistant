import { ReminderActionAdapter } from './reminder-action-adapter';

describe('ReminderActionAdapter', () => {
  it('updates the linked reminder using the owning user', async () => {
    const registry = { register: jest.fn() } as any;
    const reminders = { updateReminder: jest.fn().mockResolvedValue({ id: 'r1', title: 'Workout' }) } as any;
    const adapter = new ReminderActionAdapter(registry, reminders);

    await expect(adapter.execute(
      { id: 'd1', domain: 'reminder', action: 'update_reminder', score: 1, confidence: 1 },
      { userId: 'u1', input: 'همون رو ساعت 08:30 بذار', contextualState: { targetExecutionId: 'r1' } },
    )).resolves.toEqual({ id: 'r1', title: 'Workout' });

    expect(reminders.updateReminder).toHaveBeenCalledWith('u1', 'r1', { time: '08:30' });
    expect(registry.register).toHaveBeenCalledWith(adapter);
  });

  it('does not execute linked updates without a target id', async () => {
    const registry = { register: jest.fn() } as any;
    const reminders = { updateReminder: jest.fn() } as any;
    const adapter = new ReminderActionAdapter(registry, reminders);

    await expect(adapter.execute(
      { id: 'd1', domain: 'reminder', action: 'update_reminder', score: 1, confidence: 1 },
      { userId: 'u1', input: 'همون رو ساعت 08:30 بذار', contextualState: {} },
    )).rejects.toThrow('Missing reminder target');
    expect(reminders.updateReminder).not.toHaveBeenCalled();
  });
});
