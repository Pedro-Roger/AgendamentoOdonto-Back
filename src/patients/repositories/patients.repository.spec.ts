import { PatientsRepository } from './patients.repository';

const mockPrisma = {
  $transaction: jest.fn(),
  patient: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    delete: jest.fn(),
  },
  appointment: {
    findMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn(),
  },
  appointmentReminder: {
    deleteMany: jest.fn(),
  },
  medicalRecord: {
    findMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn(),
  },
  medicalRecordAttachment: {
    deleteMany: jest.fn(),
  },
  signatureToken: {
    deleteMany: jest.fn(),
  },
};

function makeRepo() {
  return new PatientsRepository(mockPrisma as any);
}

describe('PatientsRepository — isolamento por tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
  });

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

  it('deleteById apaga somente paciente do tenant e seus vínculos', async () => {
    const patient = { id: 'p1', tenantId: 't1' };
    mockPrisma.patient.findFirst.mockResolvedValue(patient);
    mockPrisma.appointment.findMany.mockResolvedValue([{ id: 'a1' }]);
    mockPrisma.medicalRecord.findMany.mockResolvedValue([{ id: 'r1' }]);

    await expect(makeRepo().deleteById('p1', 't1')).resolves.toBe(patient);

    expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: 't1' } });
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({ where: { patientId: 'p1', tenantId: 't1' }, select: { id: true } });
    expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith({ where: { patientId: 'p1' }, select: { id: true } });
    expect(mockPrisma.patient.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });
});
