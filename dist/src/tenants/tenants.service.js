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
exports.TenantsService = void 0;
exports.slugify = slugify;
const common_1 = require("@nestjs/common");
const tenants_repository_interface_1 = require("./repositories/tenants.repository.interface");
function slugify(value) {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
let TenantsService = class TenantsService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(data) {
        if (!data.name?.trim()) {
            throw new common_1.BadRequestException('Nome é obrigatório');
        }
        const slug = slugify(data.slug || data.name);
        if (!slug) {
            throw new common_1.BadRequestException('Slug inválido');
        }
        const existing = await this.repo.findBySlug(slug);
        if (existing) {
            throw new common_1.ConflictException('Slug já cadastrado');
        }
        return this.repo.create({ name: data.name.trim(), slug });
    }
    async resolveBySlug(slug) {
        const tenant = await this.repo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException('Compania não encontrada');
        }
        return tenant;
    }
    list() {
        return this.repo.list();
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tenants_repository_interface_1.TENANTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map