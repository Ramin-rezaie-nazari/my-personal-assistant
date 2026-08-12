import { CalendarController } from './calendar.controller';

describe('CalendarController', () => {
  it('passes the authenticated user id to the service', async () => {
    const service = { getEvents: jest.fn().mockResolvedValue([]) };
    const controller = new CalendarController(service as never);

    await controller.findAll({ user: { id: 'u1' } }, '2026-08-12T00:00:00.000Z', '2026-08-13T00:00:00.000Z');

    expect(service.getEvents).toHaveBeenCalledWith('u1', '2026-08-12T00:00:00.000Z', '2026-08-13T00:00:00.000Z');
  });
});
