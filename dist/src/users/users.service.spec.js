"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const mockRepo = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    countAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    listSafe: jest.fn(),
};
function makeService() {
    return new users_service_1.UsersService(mockRepo);
}
describe('UsersService — USR-002 RBAC roles', () => {
    beforeEach(() => jest.clearAllMocks());
    it('creates a DENTISTA user successfully', async () => {
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue({ id: '1', role: user_role_enum_1.UserRole.DENTISTA });
        const svc = makeService();
        const result = await svc.create({
            name: 'Dr. Silva',
            email: 'silva@clinic.com',
            password: 'senha123',
            role: user_role_enum_1.UserRole.DENTISTA,
        });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: user_role_enum_1.UserRole.DENTISTA }));
        expect(result).toMatchObject({ role: user_role_enum_1.UserRole.DENTISTA });
    });
    it('creates a RECEPCIONISTA user successfully', async () => {
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue({ id: '2', role: user_role_enum_1.UserRole.RECEPCIONISTA });
        const svc = makeService();
        await svc.create({
            name: 'Ana Recep',
            email: 'ana@clinic.com',
            password: 'senha123',
            role: user_role_enum_1.UserRole.RECEPCIONISTA,
        });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: user_role_enum_1.UserRole.RECEPCIONISTA }));
    });
    it('still creates MASTER and ADMIN users', async () => {
        mockRepo.findByEmail.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue({ id: '3', role: user_role_enum_1.UserRole.MASTER });
        const svc = makeService();
        await svc.create({ name: 'M', email: 'm@c.com', password: 'senha123', role: user_role_enum_1.UserRole.MASTER });
        expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: user_role_enum_1.UserRole.MASTER }));
    });
    it('throws ConflictException for duplicate email regardless of role', async () => {
        mockRepo.findByEmail.mockResolvedValue({ id: 'existing' });
        const svc = makeService();
        await expect(svc.create({ name: 'X', email: 'dup@c.com', password: 'senha123', role: user_role_enum_1.UserRole.DENTISTA })).rejects.toThrow(common_1.ConflictException);
    });
    it('throws BadRequestException for short password', async () => {
        mockRepo.findByEmail.mockResolvedValue(null);
        const svc = makeService();
        await expect(svc.create({ name: 'X', email: 'x@c.com', password: '123', role: user_role_enum_1.UserRole.DENTISTA })).rejects.toThrow(common_1.BadRequestException);
    });
});
//# sourceMappingURL=users.service.spec.js.map