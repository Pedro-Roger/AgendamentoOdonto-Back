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
exports.MedicalRecordsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MedicalRecordsRepository = class MedicalRecordsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        return this.prisma.medicalRecord.create({ data });
    }
    async update(id, data, tenantId) {
        const result = await this.prisma.medicalRecord.updateMany({
            where: { id, patient: { tenantId } },
            data,
        });
        if (result.count === 0) {
            throw new common_1.NotFoundException('Prontuário não encontrado');
        }
        return this.prisma.medicalRecord.findFirstOrThrow({
            where: { id, patient: { tenantId } },
        });
    }
    findById(id, tenantId) {
        return this.prisma.medicalRecord.findFirst({ where: { id, patient: { tenantId } } });
    }
    findByPatient(patientId, tenantId) {
        return this.prisma.medicalRecord.findMany({
            where: { patientId, patient: { tenantId } },
            orderBy: { updatedAt: 'desc' },
        });
    }
    findLatestByPatient(patientId, tenantId) {
        return this.prisma.medicalRecord.findFirst({
            where: { patientId, patient: { tenantId } },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async patientBelongsToTenant(patientId, tenantId) {
        return ((await this.prisma.patient.findFirst({
            where: { id: patientId, tenantId },
            select: { id: true },
        })) !== null);
    }
    createAttachment(data) {
        return this.prisma.medicalRecordAttachment.create({ data });
    }
    findAttachments(medicalRecordId, tenantId) {
        return this.prisma.medicalRecordAttachment.findMany({
            where: { medicalRecordId, medicalRecord: { patient: { tenantId } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MedicalRecordsRepository = MedicalRecordsRepository;
exports.MedicalRecordsRepository = MedicalRecordsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MedicalRecordsRepository);
//# sourceMappingURL=medical-records.repository.js.map