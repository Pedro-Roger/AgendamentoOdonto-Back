"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appointments_repository_1 = require("./appointments.repository");
const mockPrisma = {
    appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
    },
};
function makeRepo() {
    return new appointments_repository_1.AppointmentsRepository(mockPrisma);
}
describe('AppointmentsRepository — isolamento por tenant', () => {
    beforeEach(() => jest.clearAllMocks());
    it('findByDateWithRelations filtra por tenantId', async () => {
        await makeRepo().findByDateWithRelations('2026-06-17', 't1');
        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1', date: '2026-06-17' }) }));
    });
    it('findByDateRange filtra por tenantId', async () => {
        await makeRepo().findByDateRange('2026-06-01', '2026-06-30', 't1');
        const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
        expect(arg.where.tenantId).toBe('t1');
    });
    it('findByServiceAndDate filtra por tenantId', async () => {
        await makeRepo().findByServiceAndDate('s1', '2026-06-17', 't1');
        const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
        expect(arg.where.tenantId).toBe('t1');
    });
    it('findByPatient filtra por tenantId', async () => {
        await makeRepo().findByPatient('p1', 't1');
        const arg = mockPrisma.appointment.findMany.mock.calls[0][0];
        expect(arg.where.tenantId).toBe('t1');
    });
});
//# sourceMappingURL=appointments.repository.spec.js.map