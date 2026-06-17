import { SchedulesRepository } from './schedules.repository';
import { ServicesRepository } from './services.repository';
import { FormSettingsRepository } from './form-settings.repository';

const tx = { schedule: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
const mockPrisma: any = {
  schedule: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
  service: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn() },
  formSetting: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(tx)),
};

beforeEach(() => jest.clearAllMocks());

describe('Clinic-config repositories — isolamento por tenant', () => {
  it('SchedulesRepository.findAll filtra por tenantId', async () => {
    await new SchedulesRepository(mockPrisma).findAll('t1');
    expect(mockPrisma.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } }),
    );
  });

  it('SchedulesRepository.replaceAll só apaga horários do tenant', async () => {
    await new SchedulesRepository(mockPrisma).replaceAll([], 't1');
    expect(tx.schedule.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 't1' } });
  });

  it('ServicesRepository.findActive filtra por tenantId', async () => {
    await new ServicesRepository(mockPrisma).findActive('t1');
    expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, tenantId: 't1' } }),
    );
  });

  it('FormSettingsRepository.findLatest filtra por tenantId', async () => {
    await new FormSettingsRepository(mockPrisma).findLatest('t1');
    expect(mockPrisma.formSetting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } }),
    );
  });
});
