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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ServicesRepository = class ServicesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data, tenantId) {
        return this.prisma.service.create({ data: { ...data, tenantId } });
    }
    findActive(tenantId) {
        return this.prisma.service.findMany({ where: { isActive: true, tenantId } });
    }
    async update(id, data, tenantId) {
        const result = await this.prisma.service.updateMany({ where: { id, tenantId }, data });
        if (result.count === 0)
            throw new common_1.NotFoundException('Serviço não encontrado');
        return this.prisma.service.findFirstOrThrow({ where: { id, tenantId } });
    }
};
exports.ServicesRepository = ServicesRepository;
exports.ServicesRepository = ServicesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesRepository);
//# sourceMappingURL=services.repository.js.map