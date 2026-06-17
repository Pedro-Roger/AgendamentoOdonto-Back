"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schedules_repository_1 = require("./schedules.repository");
const services_repository_1 = require("./services.repository");
const form_settings_repository_1 = require("./form-settings.repository");
const tx = { schedule: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
const mockPrisma = {
    schedule: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    service: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn() },
    formSetting: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
    $transaction: jest.fn(async (cb) => cb(tx)),
};
beforeEach(() => jest.clearAllMocks());
describe('Clinic-config repositories — isolamento por tenant', () => {
    it('SchedulesRepository.findAll filtra por tenantId', async () => {
        await new schedules_repository_1.SchedulesRepository(mockPrisma).findAll('t1');
        expect(mockPrisma.schedule.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1' } }));
    });
    it('SchedulesRepository.replaceAll só apaga horários do tenant', async () => {
        await new schedules_repository_1.SchedulesRepository(mockPrisma).replaceAll([], 't1');
        expect(tx.schedule.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 't1' } });
    });
    it('ServicesRepository.findActive filtra por tenantId', async () => {
        await new services_repository_1.ServicesRepository(mockPrisma).findActive('t1');
        expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true, tenantId: 't1' } }));
    });
    it('FormSettingsRepository.findLatest filtra por tenantId', async () => {
        await new form_settings_repository_1.FormSettingsRepository(mockPrisma).findLatest('t1');
        expect(mockPrisma.formSetting.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1' } }));
    });
});
//# sourceMappingURL=clinic-config.repositories.spec.js.map