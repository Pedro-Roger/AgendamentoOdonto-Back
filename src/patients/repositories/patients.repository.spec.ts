import { PatientsRepository } from './patients.repository';

const mockPrisma = {
  patient: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  },
};

function makeRepo() {
  return new PatientsRepository(mockPrisma as any);
}

describe('PatientsRepository — isolamento por tenant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('findAll filtra SEMPRE por tenantId', async () => {
    const repo = makeRepo();
    await repo.findAll('t1');
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
    );
  });

  it('findAll com busca combina q E tenantId', async () => {
    const repo = makeRepo();
    await repo.findAll('t1', 'maria');
    const arg = mockPrisma.patient.findMany.mock.calls[0][0];
    expect(arg.where.tenantId).toBe('t1');
    expect(arg.where.OR).toBeDefined();
  });

  it('findByCpfAndTenant usa cpf + tenantId', async () => {
    const repo = makeRepo();
    await repo.findByCpfAndTenant('123', 't1');
    expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cpf_tenantId: { cpf: '123', tenantId: 't1' } }),
      }),
    );
  });
});
