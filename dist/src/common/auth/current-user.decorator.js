"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
exports.extractCurrentUser = extractCurrentUser;
const common_1 = require("@nestjs/common");
function extractCurrentUser(_data, ctx) {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
}
exports.CurrentUser = (0, common_1.createParamDecorator)(extractCurrentUser);
//# sourceMappingURL=current-user.decorator.js.map