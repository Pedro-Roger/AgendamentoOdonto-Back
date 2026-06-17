"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const medical_records_repository_1 = require("./medical-records.repository");
const mockPrisma = {
    medicalRecord: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
    },
    medicalRecordAttachment: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    patient: {
        findFirst: jest.fn(),
    },
};
function makeRepo() {
    return new medical_records_repository_1.MedicalRecordsRepository(mockPrisma);
}
describe('MedicalRecordsRepository — isolamento por tenant', () => {
    beforeEach(() => jest.clearAllMocks());
    it('findById filtra por id + patient.tenantId', async () => {
        mockPrisma.medicalRecord.findFirst.mockResolvedValue(null);
        const repo = makeRepo();
        await repo.findById('r1', 't1');
        expect(mockPrisma.medicalRecord.findFirst).toHaveBeenCalledWith({
            where: { id: 'r1', patient: { tenantId: 't1' } },
        });
    });
    it('update usa updateMany com id + patient.tenantId e retorna o registro', async () => {
        mockPrisma.medicalRecord.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.medicalRecord.findFirstOrThrow.mockResolvedValue({ id: 'r1' });
        const repo = makeRepo();
        const res = await repo.update('r1', { content: { a: 1 } }, 't1');
        expect(mockPrisma.medicalRecord.updateMany).toHaveBeenCalledWith({
            where: { id: 'r1', patient: { tenantId: 't1' } },
            data: { content: { a: 1 } },
        });
        expect(mockPrisma.medicalRecord.findFirstOrThrow).toHaveBeenCalledWith({
            where: { id: 'r1', patient: { tenantId: 't1' } },
        });
        expect(res).toEqual({ id: 'r1' });
    });
    it('update lança NotFoundException quando count === 0', async () => {
        mockPrisma.medicalRecord.updateMany.mockResolvedValue({ count: 0 });
        const repo = makeRepo();
        await expect(repo.update('r1', { content: {} }, 't1')).rejects.toBeInstanceOf(common_1.NotFoundException);
        expect(mockPrisma.medicalRecord.findFirstOrThrow).not.toHaveBeenCalled();
    });
    it('findLatestByPatient inclui patient.tenantId', async () => {
        mockPrisma.medicalRecord.findFirst.mockResolvedValue(null);
        const repo = makeRepo();
        await repo.findLatestByPatient('p1', 't1');
        expect(mockPrisma.medicalRecord.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { patientId: 'p1', patient: { tenantId: 't1' } },
        }));
    });
    it('findAttachments escopa via medicalRecord.patient.tenantId', async () => {
        mockPrisma.medicalRecordAttachment.findMany.mockResolvedValue([]);
        const repo = makeRepo();
        await repo.findAttachments('r1', 't1');
        expect(mockPrisma.medicalRecordAttachment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { medicalRecordId: 'r1', medicalRecord: { patient: { tenantId: 't1' } } },
        }));
    });
    it('patientBelongsToTenant retorna true quando o paciente existe no tenant', async () => {
        mockPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
        const repo = makeRepo();
        await expect(repo.patientBelongsToTenant('p1', 't1')).resolves.toBe(true);
        expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({
            where: { id: 'p1', tenantId: 't1' },
            select: { id: true },
        });
    });
    it('patientBelongsToTenant retorna false quando não existe', async () => {
        mockPrisma.patient.findFirst.mockResolvedValue(null);
        const repo = makeRepo();
        await expect(repo.patientBelongsToTenant('p1', 't1')).resolves.toBe(false);
    });
});
//# sourceMappingURL=medical-records.repository.spec.js.map