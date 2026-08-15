import { RemindersController } from './reminders.controller';

describe('RemindersController', () => {
  const service = {
    createReminder: jest.fn(),
    getReminders: jest.fn(),
    getNextReminder: jest.fn(),
    updateReminder: jest.fn(),
    completeReminder: jest.fn(),
    reopenReminder: jest.fn(),
    deleteReminder: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated owner to create', async () => {
    service.createReminder.mockResolvedValue({ id: 'r1' });
    const controller = new RemindersController(service as never);
    const dto = { title: 'Water', type: 'health', time: '09:00' };

    await controller.create({ user: { id: 'u1' } }, dto);

    expect(service.createReminder).toHaveBeenCalledWith('u1', dto);
  });

  it('parses includeCompleted explicitly', async () => {
    service.getReminders.mockResolvedValue([]);
    const controller = new RemindersController(service as never);

    await controller.findAll({ user: { id: 'u1' } }, 'true');
    await controller.findAll({ user: { id: 'u1' } }, 'false');
    await controller.findAll({ user: { id: 'u1' } });

    expect(service.getReminders).toHaveBeenNthCalledWith(1, 'u1', true);
    expect(service.getReminders).toHaveBeenNthCalledWith(2, 'u1', false);
    expect(service.getReminders).toHaveBeenNthCalledWith(3, 'u1', false);
  });

  it('delegates next, update, complete, reopen and delete with the authenticated owner', async () => {
    const controller = new RemindersController(service as never);
    const req = { user: { id: 'u1' } };
    const patch = { title: 'Updated', time: '18:30' };

    await controller.getNext(req);
    await controller.update(req, 'r1', patch);
    await controller.complete(req, 'r1');
    await controller.reopen(req, 'r1');
    await controller.delete(req, 'r1');

    expect(service.getNextReminder).toHaveBeenCalledWith('u1');
    expect(service.updateReminder).toHaveBeenCalledWith('u1', 'r1', patch);
    expect(service.completeReminder).toHaveBeenCalledWith('u1', 'r1');
    expect(service.reopenReminder).toHaveBeenCalledWith('u1', 'r1');
    expect(service.deleteReminder).toHaveBeenCalledWith('u1', 'r1');
  });
});
