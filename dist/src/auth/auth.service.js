"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = require("bcryptjs");
const users_repository_interface_1 = require("../users/repositories/users.repository.interface");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let AuthService = class AuthService {
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async login(email, password) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user)
            return null;
        if (!user.password || !user.password.startsWith('$2')) {
            return null;
        }
        const passwordOk = (0, bcryptjs_1.compareSync)(password, user.password);
        if (!passwordOk)
            return null;
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken,
            tokenType: 'Bearer',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    }
    async bootstrapMaster(body) {
        const count = await this.usersRepository.countAll();
        if (count > 0) {
            throw new common_1.BadRequestException('Bootstrap disabled: users already exist');
        }
        const user = await this.usersRepository.create({
            name: body.name,
            email: body.email,
            password: (0, bcryptjs_1.hashSync)(body.password, 10),
            role: user_role_enum_1.UserRole.MASTER,
        });
        return { id: user.id, email: user.email, role: user.role };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_interface_1.USERS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map