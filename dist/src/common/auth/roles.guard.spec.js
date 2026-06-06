"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const roles_guard_1 = require("./roles.guard");
function mockContext(role) {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => ({ user: { role } }),
        }),
    };
}
describe('RolesGuard', () => {
    let guard;
    let reflector;
    const origEnv = process.env.NODE_ENV;
    beforeEach(() => {
        process.env.NODE_ENV = 'production';
        reflector = { getAllAndOverride: jest.fn() };
        guard = new roles_guard_1.RolesGuard(reflector);
    });
    afterEach(() => {
        process.env.NODE_ENV = origEnv;
    });
    it('passes when no roles required', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        expect(guard.canActivate(mockContext('RECEPCIONISTA'))).toBe(true);
    });
    it('allows MASTER on any endpoint', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA']);
        expect(guard.canActivate(mockContext('MASTER'))).toBe(true);
    });
    it('allows DENTISTA on medical-records endpoints (MASTER,ADMIN,DENTISTA)', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA']);
        expect(guard.canActivate(mockContext('DENTISTA'))).toBe(true);
    });
    it('blocks RECEPCIONISTA from medical-records', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA']);
        expect(() => guard.canActivate(mockContext('RECEPCIONISTA'))).toThrow(common_1.ForbiddenException);
    });
    it('blocks DENTISTA from financial endpoints (MASTER,ADMIN only)', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
        expect(() => guard.canActivate(mockContext('DENTISTA'))).toThrow(common_1.ForbiddenException);
    });
    it('blocks RECEPCIONISTA from financial endpoints', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
        expect(() => guard.canActivate(mockContext('RECEPCIONISTA'))).toThrow(common_1.ForbiddenException);
    });
    it('allows RECEPCIONISTA on patient list (all roles)', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA']);
        expect(guard.canActivate(mockContext('RECEPCIONISTA'))).toBe(true);
    });
    it('blocks unknown role', () => {
        reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
        expect(() => guard.canActivate(mockContext('UNKNOWN'))).toThrow(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=roles.guard.spec.js.map