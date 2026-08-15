import { CalendarController } from './calendar.controller';

describe('CalendarController', () => {
  const makeService = () => ({
    createEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
    getEvents: jest.fn().mockResolvedValue([]),
    updateEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
    completeEvent: jest.fn().mockResolvedValue({ id: 'e1', completed: true }),
    reopenEvent: jest.fn().mockResolvedValue({ id: 'e1', completed: false }),
    deleteEvent: jest.fn().mockResolvedValue({ id: 'e1', deleted: true }),
  });

  it('passes the authenticated user id to findAll', async () => {
    const service = makeService();
    const controller = new CalendarController(service as never);

    await controller.findAll({ user: { id: 'u1' } }, '2026-08-12T00:00:00.000Z', '2026-08-13T00:00:00.000Z');

    expect(service.getEvents).toHaveBeenCalledWith('u1', '2026-08-12T00:00:00.000Z', '2026-08-13T00:00:00.000Z');
  });

  it('passes the authenticated user id through every mutating endpoint', async () => {
    const service = makeService();
    const controller = new CalendarController(service as never);
    const req = { user: { id: 'u1' } };
    const dto = { title: 'Gym', type: 'workout', startsAt: '2026-08-14T18:00:00Z', endsAt: '2026-08-14T19:00:00Z' };
    const patch = { title: 'Dinner', startsAt: '2026-08-14T20:00:00Z', endsAt: '2026-08-14T21:00:00Z' };

    await controller.createEvent(req, dto);
    await controller.updateEvent(req, 'e1', patch);
    await controller.complete(req, 'e1');
    await controller.reopen(req, 'e1');
    await controller.delete(req, 'e1');

    expect(service.createEvent).toHaveBeenCalledWith('u1', dto);
    expect(service.updateEvent).toHaveBeenCalledWith('u1', 'e1', patch);
    expect(service.completeEvent).toHaveBeenCalledWith('u1', 'e1');
    expect(service.reopenEvent).toHaveBeenCalledWith('u1', 'e1');
    expect(service.deleteEvent).toHaveBeenCalledWith('u1', 'e1');
  });

  it('returns service results unchanged', async () => {
    const service = makeService();
    const controller = new CalendarController(service as never);

    await expect(controller.createEvent({ user: { id: 'u1' } }, { title: 'x', type: 'general', startsAt: '2026-08-14T18:00:00Z' })).resolves.toEqual({ id: 'e1' });
    await expect(controller.findAll({ user: { id: 'u1' } })).resolves.toEqual([]);
    await expect(controller.updateEvent({ user: { id: 'u1' } }, 'e1', { title: 'x' })).resolves.toEqual({ id: 'e1' });
    await expect(controller.complete({ user: { id: 'u1' } }, 'e1')).resolves.toEqual({ id: 'e1', completed: true });
    await expect(controller.reopen({ user: { id: 'u1' } }, 'e1')).resolves.toEqual({ id: 'e1', completed: false });
    await expect(controller.delete({ user: { id: 'u1' } }, 'e1')).resolves.toEqual({ id: 'e1', deleted: true });
  });
});
