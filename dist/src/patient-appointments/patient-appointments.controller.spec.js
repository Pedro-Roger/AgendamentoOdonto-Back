"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const patient_appointments_controller_1 = require("./patient-appointments.controller");
const mockService = {
    listActiveServices: jest.fn().mockResolvedValue([]),
    getFormSettings: jest.fn().mockResolvedValue(null),
    getAvailableSchedules: jest.fn().mockResolvedValue([]),
    createAppointment: jest.fn().mockResolvedValue({ id: 'a1' }),
};
const mockTenants = { resolveBySlug: jest.fn().mockResolvedValue({ id: 't1', slug: 'dra-herlania' }) };
function makeController() {
    return new patient_appointments_controller_1.PatientAppointmentsController(mockService, mockTenants);
}
describe('PatientAppointmentsController — booking por slug', () => {
    beforeEach(() => jest.clearAllMocks());
    it('resolve o tenant pelo slug antes de listar serviços', async () => {
        await makeController().listServices('dra-herlania');
        expect(mockTenants.resolveBySlug).toHaveBeenCalledWith('dra-herlania');
        expect(mockService.listActiveServices).toHaveBeenCalledWith('t1');
    });
    it('cria agendamento no tenant do slug com source PUBLIC', async () => {
        const dto = { name: 'A', cpf: '1', email: 'a@b.com', phone: '9', serviceId: 's1', date: '2026-06-18', time: '09:00', anamnesisAnswers: {} };
        await makeController().create('dra-herlania', dto);
        expect(mockService.createAppointment).toHaveBeenCalledWith('t1', dto, 'PUBLIC');
    });
});
//# sourceMappingURL=patient-appointments.controller.spec.js.map