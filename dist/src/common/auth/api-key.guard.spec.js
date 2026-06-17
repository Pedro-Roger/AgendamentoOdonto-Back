"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("./api-key.guard");
const mockApiKeys = { validate: jest.fn() };
function ctx(headers) {
    const req = { headers };
    return {
        switchToHttp: () => ({ getRequest: () => req }),
        _req: req,
    };
}
function makeGuard() {
    return new api_key_guard_1.ApiKeyGuard(mockApiKeys);
}
describe('ApiKeyGuard', () => {
    beforeEach(() => jest.clearAllMocks());
    it('rejeita quando falta X-Api-Key', async () => {
        await expect(makeGuard().canActivate(ctx({}))).rejects.toBeInstanceOf(common_1.UnauthorizedException);
    });
    it('rejeita chave inválida', async () => {
        mockApiKeys.validate.mockResolvedValue(null);
        await expect(makeGuard().canActivate(ctx({ 'x-api-key': 'sk_x' }))).rejects.toBeInstanceOf(common_1.UnauthorizedException);
    });
    it('aceita chave válida e injeta tenantId no request', async () => {
        mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: [] });
        const c = ctx({ 'x-api-key': 'sk_ok' });
        const ok = await makeGuard().canActivate(c);
        expect(ok).toBe(true);
        expect(c._req.tenantId).toBe('t1');
    });
    it('bloqueia Origin fora de allowedOrigins', async () => {
        mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: ['https://herlania.com'] });
        await expect(makeGuard().canActivate(ctx({ 'x-api-key': 'sk_ok', origin: 'https://evil.com' }))).rejects.toBeInstanceOf(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=api-key.guard.spec.js.map