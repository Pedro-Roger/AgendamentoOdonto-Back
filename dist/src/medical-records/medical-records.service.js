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
exports.MedicalRecordsService = void 0;
const common_1 = require("@nestjs/common");
const medical_records_repository_interface_1 = require("./repositories/medical-records.repository.interface");
const s3_service_1 = require("../shared/s3.service");
const attachment_category_enum_1 = require("../common/enums/attachment-category.enum");
let MedicalRecordsService = class MedicalRecordsService {
    constructor(medicalRecordsRepository, s3Service) {
        this.medicalRecordsRepository = medicalRecordsRepository;
        this.s3Service = s3Service;
    }
    async upsertByPatient(patientId, content) {
        const existing = await this.medicalRecordsRepository.findLatestByPatient(patientId);
        if (existing) {
            return this.medicalRecordsRepository.update(existing.id, {
                content: content,
            });
        }
        return this.medicalRecordsRepository.create({
            patientId,
            content: content,
            version: 1,
        });
    }
    create(patientId, content, appointmentId) {
        return this.medicalRecordsRepository.create({
            patientId,
            appointmentId,
            content: content,
            version: 1,
        });
    }
    async duplicate(id) {
        const current = await this.medicalRecordsRepository.findById(id);
        if (!current)
            throw new common_1.NotFoundException('Prontuário não encontrado');
        return this.medicalRecordsRepository.create({
            patientId: current.patientId,
            content: current.content,
            version: current.version + 1,
        });
    }
    async findOne(id) {
        const record = await this.medicalRecordsRepository.findById(id);
        if (!record)
            throw new common_1.NotFoundException('Prontuário não encontrado');
        return record;
    }
    findByPatient(patientId) {
        return this.medicalRecordsRepository.findLatestByPatient(patientId);
    }
    listAllByPatient(patientId, tenantId) {
        return this.medicalRecordsRepository.findByPatient(patientId, tenantId);
    }
    async updateById(id, content) {
        const existing = await this.medicalRecordsRepository.findById(id);
        if (!existing)
            throw new common_1.NotFoundException('Prontuário não encontrado');
        return this.medicalRecordsRepository.update(id, {
            content: content,
        });
    }
    async attach(id, file) {
        const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
        return this.medicalRecordsRepository.createAttachment({
            medicalRecordId: id,
            fileUrl,
            category: attachment_category_enum_1.AttachmentCategory.MEDICAL_ATTACHMENT,
        });
    }
    async listAttachments(medicalRecordId) {
        const record = await this.medicalRecordsRepository.findById(medicalRecordId);
        if (!record)
            throw new common_1.NotFoundException('Prontuário não encontrado');
        const attachments = await this.medicalRecordsRepository.findAttachments(medicalRecordId);
        return attachments.map((a) => ({
            ...a,
            fileUrl: this.s3Service.getSignedUrl(a.fileUrl),
        }));
    }
};
exports.MedicalRecordsService = MedicalRecordsService;
exports.MedicalRecordsService = MedicalRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(medical_records_repository_interface_1.MEDICAL_RECORDS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, s3_service_1.S3Service])
], MedicalRecordsService);
//# sourceMappingURL=medical-records.service.js.map