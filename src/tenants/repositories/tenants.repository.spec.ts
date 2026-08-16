import { TenantsRepository } from './tenants.repository';

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

function makeRepo() {
  return new TenantsRepository(mockPrisma as any);
}

describe('TenantsRepository — contagens agregadas e status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listWithCounts inclui _count de users/patients/appointments numa única query', async () => {
    mockPrisma.tenant.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Dra Herlania',
        slug: 'dra-herlania',
        isActive: true,
        _count: { users: 2, patients: 10, appointments: 30 },
      },
    ]);
    const result = await makeRepo().listWithCounts();
    expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { _count: { select: { users: true, patients: true, appointments: true } } },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 't1',
        usersCount: 2,
        patientsCount: 10,
        appointmentsCount: 30,
      }),
    ]);
    expect((result[0] as any)._count).toBeUndefined();
  });

  it('findByIdWithCounts retorna null quando a Compania não existe', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    expect(await makeRepo().findByIdWithCounts('nada')).toBeNull();
  });

  it('findByIdWithCounts mapeia contagens de uma Compania', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 't1',
      _count: { users: 1, patients: 0, appointments: 0 },
    });
    const result = await makeRepo().findByIdWithCounts('t1');
    expect(result).toEqual(
      expect.objectContaining({ id: 't1', usersCount: 1, patientsCount: 0, appointmentsCount: 0 }),
    );
  });

  it('updateActive grava isActive por id', async () => {
    mockPrisma.tenant.update.mockResolvedValue({ id: 't1', isActive: false });
    await makeRepo().updateActive('t1', false);
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { isActive: false },
    });
  });
});
