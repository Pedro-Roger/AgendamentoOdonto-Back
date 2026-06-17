"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("./tenants.service");
const mockRepo = { findBySlug: jest.fn(), findById: jest.fn(), create: jest.fn(), list: jest.fn() };
function makeService() { return new tenants_service_1.TenantsService(mockRepo); }
describe('TenantsService', () => {
    beforeEach(() => jest.clearAllMocks());
    it('cria tenant com slug normalizado', async () => {
        mockRepo.findBySlug.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue({ id: 't1', slug: 'dra-herlania' });
        await makeService().create({ name: 'Dra Herlânia', slug: 'Dra Herlânia' });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'dra-herlania' }));
    });
    it('rejeita slug duplicado', async () => {
        mockRepo.findBySlug.mockResolvedValue({ id: 't0' });
        await expect(makeService().create({ name: 'X', slug: 'dra-herlania' })).rejects.toBeInstanceOf(common_1.ConflictException);
    });
    it('rejeita nome vazio', async () => {
        await expect(makeService().create({ name: '  ', slug: 'x' })).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('resolveBySlug lança NotFound quando inexistente', async () => {
        mockRepo.findBySlug.mockResolvedValue(null);
        await expect(makeService().resolveBySlug('nada')).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('resolveBySlug retorna o tenant', async () => {
        mockRepo.findBySlug.mockResolvedValue({ id: 't1', isActive: true });
        expect(await makeService().resolveBySlug('dra-herlania')).toMatchObject({ id: 't1' });
    });
});
//# sourceMappingURL=tenants.service.spec.js.map