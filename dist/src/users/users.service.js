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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = require("bcryptjs");
const users_repository_interface_1 = require("./repositories/users.repository.interface");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(data, tenantId) {
        if (!data.name?.trim() || !data.email?.trim() || !data.password) {
            throw new common_1.BadRequestException('Nome, email e senha são obrigatórios');
        }
        if (data.password.length < 6) {
            throw new common_1.BadRequestException('Senha deve ter pelo menos 6 caracteres');
        }
        const existing = await this.usersRepository.findByEmail(data.email);
        if (existing) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const user = await this.usersRepository.create({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: (0, bcryptjs_1.hashSync)(data.password, 10),
            role: data.role ?? user_role_enum_1.UserRole.ADMIN,
            tenantId,
        });
        const { password: _, ...safe } = user;
        return safe;
    }
    async update(id, data, currentUserId) {
        const target = await this.usersRepository.findById(id);
        if (!target)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (target.id === currentUserId && data.isActive === false) {
            throw new common_1.BadRequestException('Não é possível desativar a própria conta');
        }
        if (target.id === currentUserId && data.role && data.role !== target.role) {
            throw new common_1.BadRequestException('Não é possível alterar o próprio papel');
        }
        const patch = {};
        if (typeof data.name === 'string' && data.name.trim())
            patch.name = data.name.trim();
        if (typeof data.email === 'string' && data.email.trim()) {
            const email = data.email.trim().toLowerCase();
            if (email !== target.email) {
                const existing = await this.usersRepository.findByEmail(email);
                if (existing)
                    throw new common_1.ConflictException('Email já cadastrado');
                patch.email = email;
            }
        }
        if (typeof data.password === 'string' && data.password) {
            if (data.password.length < 6) {
                throw new common_1.BadRequestException('Senha deve ter pelo menos 6 caracteres');
            }
            patch.password = (0, bcryptjs_1.hashSync)(data.password, 10);
        }
        if (data.role)
            patch.role = data.role;
        if (typeof data.isActive === 'boolean')
            patch.isActive = data.isActive;
        return this.usersRepository.update(id, patch);
    }
    list() {
        return this.usersRepository.listSafe();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_interface_1.USERS_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UsersService);
//# sourceMappingURL=users.service.js.map