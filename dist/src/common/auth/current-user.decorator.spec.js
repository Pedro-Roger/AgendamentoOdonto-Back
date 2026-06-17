"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const current_user_decorator_1 = require("./current-user.decorator");
function ctxWithUser(user) {
    return { switchToHttp: () => ({ getRequest: () => ({ user }) }) };
}
describe('extractCurrentUser', () => {
    it('retorna o user do request', () => {
        const user = { sub: 'u1', email: 'a@b.com', role: 'ADMIN', tenantId: 't1' };
        expect((0, current_user_decorator_1.extractCurrentUser)(undefined, ctxWithUser(user))).toEqual(user);
    });
    it('retorna undefined quando não há user', () => {
        expect((0, current_user_decorator_1.extractCurrentUser)(undefined, ctxWithUser(undefined))).toBeUndefined();
    });
});
//# sourceMappingURL=current-user.decorator.spec.js.map