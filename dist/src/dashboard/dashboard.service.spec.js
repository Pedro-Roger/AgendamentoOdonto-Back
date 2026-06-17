"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_service_1 = require("./dashboard.service");
const mockPrisma = {
    appointment: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
            { date: '2026-06-16', source: 'INTERNAL', service: { name: 'Limpeza' } },
            { date: '2026-06-16', source: 'INTEGRATION', service: { name: 'Limpeza' } },
            { date: '2026-06-17', source: 'PUBLIC', service: { name: 'Canal' } },
        ]),
    },
    patient: { count: jest.fn().mockResolvedValue(2) },
};
function makeService() {
    return new dashboard_service_1.DashboardService(mockPrisma);
}
describe('DashboardService', () => {
    beforeEach(() => jest.clearAllMocks());
    it('todas as queries filtram por tenantId', async () => {
        await makeService().summary('t1', '2026-06-01', '2026-06-30');
        expect(mockPrisma.appointment.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }));
        expect(mockPrisma.patient.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }));
    });
    it('agrega consultas por dia, serviço e origem', async () => {
        const r = await makeService().summary('t1', '2026-06-01', '2026-06-30');
        expect(r.appointmentsByDay).toEqual(expect.arrayContaining([{ date: '2026-06-16', count: 2 }, { date: '2026-06-17', count: 1 }]));
        expect(r.appointmentsByService).toEqual(expect.arrayContaining([{ name: 'Limpeza', count: 2 }, { name: 'Canal', count: 1 }]));
        expect(r.appointmentsBySource).toEqual(expect.arrayContaining([
            { source: 'INTERNAL', count: 1 },
            { source: 'INTEGRATION', count: 1 },
            { source: 'PUBLIC', count: 1 },
        ]));
    });
});
//# sourceMappingURL=dashboard.service.spec.js.map