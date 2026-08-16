import { CalendarActionAdapter } from './calendar-action-adapter';

describe('CalendarActionAdapter', () => {
  it('updates the linked event time without changing its date', async () => {
    const execute = jest.fn();
    const registry = { register: () => registry } as any;
    const calendar = { updateEventTime: execute } as any;
    execute.mockResolvedValue({
      id: 'e1',
      startsAt: '2026-08-14T18:00:00.000Z',
    });
    const adapter = new CalendarActionAdapter(registry, calendar);

    const result = await adapter.execute(
      { action: 'update_calendar_event' } as any,
      {
        userId: 'u1',
        input: 'همون جلسه رو ساعت 18:00 بذار',
        contextualState: { targetResourceId: 'e1' },
      },
    );

    expect(execute).toHaveBeenCalledWith('u1', 'e1', '18:00');
    expect(result).toMatchObject({ id: 'e1' });
  });

  it('uses ownership-scoped completion for cancel', async () => {
    const registry = { register: () => registry } as any;
    const calendar = {
      completeEvent: jest.fn().mockResolvedValue({ completed: true }),
    } as any;
    const adapter = new CalendarActionAdapter(registry, calendar);

    await adapter.execute({ action: 'cancel_calendar_event' } as any, {
      userId: 'u1',
      input: 'لغو کن',
      contextualState: { targetResourceId: 'e2' },
    });

    expect(calendar.completeEvent).toHaveBeenCalledWith('u1', 'e2');
  });
});
