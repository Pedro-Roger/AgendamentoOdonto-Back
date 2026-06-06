"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_service_1 = require("./whatsapp.service");
const mockConfig = {
    findActive: jest.fn(),
};
const mockFetch = jest.fn();
global.fetch = mockFetch;
function makeService() {
    return new whatsapp_service_1.WhatsAppService(mockConfig);
}
describe('WhatsAppService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConfig.findActive.mockResolvedValue({
            instanceId: 'inst123',
            token: 'tok456',
            clinicName: 'Sorriso',
            clinicAddress: 'Rua das Flores, 100',
            isActive: true,
        });
    });
    it('sends a WhatsApp message via Z-API when config is active', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ zaapId: 'z1' }) });
        const svc = makeService();
        const result = await svc.sendText('11999999999', 'Olá, teste!');
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('inst123'), expect.objectContaining({ method: 'POST' }));
        expect(result).toBe(true);
    });
    it('returns false when no active config', async () => {
        mockConfig.findActive.mockResolvedValue(null);
        const svc = makeService();
        const result = await svc.sendText('11999999999', 'Olá!');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('returns false when Z-API returns not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
        const svc = makeService();
        const result = await svc.sendText('11999999999', 'Olá!');
        expect(result).toBe(false);
    });
    it('builds appointment reminder message with all required fields', () => {
        const svc = makeService();
        const msg = svc.buildReminderMessage({
            patientName: 'Maria Silva',
            serviceName: 'Consulta de rotina',
            date: '2026-06-10',
            time: '09:00',
            clinicName: 'Sorriso',
            clinicAddress: 'Rua das Flores, 100',
            confirmationToken: 'tok123',
            baseUrl: 'https://app.sorriso.com',
        });
        expect(msg).toContain('Maria Silva');
        expect(msg).toContain('09:00');
        expect(msg).toContain('Rua das Flores');
        expect(msg).toContain('tok123');
        expect(msg).toContain('SIM');
    });
    it('formats phone number removing non-digits and adds 55 prefix', () => {
        const svc = makeService();
        expect(svc.formatPhone('(11) 99999-9999')).toBe('5511999999999');
        expect(svc.formatPhone('11999999999')).toBe('5511999999999');
        expect(svc.formatPhone('5511999999999')).toBe('5511999999999');
    });
});
//# sourceMappingURL=whatsapp.service.spec.js.map