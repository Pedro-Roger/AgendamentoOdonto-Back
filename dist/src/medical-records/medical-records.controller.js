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
exports.MedicalRecordsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/auth/roles.decorator");
const roles_guard_1 = require("../common/auth/roles.guard");
const platform_express_1 = require("@nestjs/platform-express");
const create_medical_record_dto_1 = require("./dto/create-medical-record.dto");
const update_medical_record_dto_1 = require("./dto/update-medical-record.dto");
const medical_records_service_1 = require("./medical-records.service");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'application/pdf',
]);
let MedicalRecordsController = class MedicalRecordsController {
    constructor(medicalRecordsService) {
        this.medicalRecordsService = medicalRecordsService;
    }
    create(body) {
        return this.medicalRecordsService.upsertByPatient(body.patientId, body.content);
    }
    duplicate(id) {
        return this.medicalRecordsService.duplicate(id);
    }
    findOne(id) {
        return this.medicalRecordsService.findOne(id);
    }
    listAllByPatient(patientId) {
        return this.medicalRecordsService.listAllByPatient(patientId);
    }
    createForPatient(patientId, body) {
        return this.medicalRecordsService.create(patientId, body.content ?? {});
    }
    updateRecord(id, body) {
        return this.medicalRecordsService.updateById(id, body.content ?? {});
    }
    findByPatient(patientId) {
        return this.medicalRecordsService.findByPatient(patientId);
    }
    listAttachments(id) {
        return this.medicalRecordsService.listAttachments(id);
    }
    attach(id, file) {
        if (!file)
            throw new common_1.BadRequestException('Arquivo obrigatório');
        if (!ALLOWED_MIME.has(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido');
        }
        return this.medicalRecordsService.attach(id, file);
    }
};
exports.MedicalRecordsController = MedicalRecordsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_medical_record_dto_1.CreateMedicalRecordDto]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('patient/:patientId/history'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "listAllByPatient", null);
__decorate([
    (0, common_1.Post)('patient/:patientId/new'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_medical_record_dto_1.UpdateMedicalRecordDto]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "createForPatient", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_medical_record_dto_1.UpdateMedicalRecordDto]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "updateRecord", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)(':id/attachments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "listAttachments", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MedicalRecordsController.prototype, "attach", null);
exports.MedicalRecordsController = MedicalRecordsController = __decorate([
    (0, common_1.Controller)('api/medical-records'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA'),
    __metadata("design:paramtypes", [medical_records_service_1.MedicalRecordsService])
], MedicalRecordsController);
//# sourceMappingURL=medical-records.controller.js.map