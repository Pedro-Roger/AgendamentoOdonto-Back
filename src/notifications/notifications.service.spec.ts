import { NotificationsService } from './notifications.service';

const mockPrisma: any = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};
function makeService() {
  return new NotificationsService(mockPrisma);
}

describe('NotificationsService — isolamento por tenant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('create injeta tenantId', async () => {
    await makeService().create({ type: 'X', title: 't', message: 'm', tenantId: 't1' });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });

  it('listUnread filtra por tenantId', async () => {
    await makeService().listUnread('t1');
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ readAt: null, tenantId: 't1' }) }),
    );
  });
});
