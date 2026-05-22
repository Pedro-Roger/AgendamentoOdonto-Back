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
exports.SignaturesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const s3_service_1 = require("./shared/s3.service");
const attachment_category_enum_1 = require("./common/enums/attachment-category.enum");
const signature_tokens_repository_interface_1 = require("./signatures/repositories/signature-tokens.repository.interface");
const medical_records_repository_interface_1 = require("./medical-records/repositories/medical-records.repository.interface");
const SIGNATURE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BASE64_BYTES = 2 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHYSICAL_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
]);
let SignaturesService = class SignaturesService {
    constructor(signatureTokensRepository, medicalRecordsRepository, s3Service) {
        this.signatureTokensRepository = signatureTokensRepository;
        this.medicalRecordsRepository = medicalRecordsRepository;
        this.s3Service = s3Service;
    }
    async uploadPhysical(medicalRecordId, file) {
        if (!file)
            throw new common_1.BadRequestException('Arquivo obrigatório');
        if (file.size > MAX_FILE_BYTES)
            throw new common_1.BadRequestException('Arquivo excede 5MB');
        if (!ALLOWED_PHYSICAL_MIME.has(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido');
        }
        const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
        return this.medicalRecordsRepository.createAttachment({
            medicalRecordId,
            fileUrl,
            category: attachment_category_enum_1.AttachmentCategory.PHYSICAL_SIGNATURE,
        });
    }
    generateElectronicLink(medicalRecordId) {
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        return this.signatureTokensRepository.create(token, medicalRecordId);
    }
    async submitElectronic(token, body, ipAddress) {
        const signatureToken = await this.signatureTokensRepository.findByToken(token);
        if (!signatureToken)
            throw new common_1.NotFoundException('Token inválido');
        if (signatureToken.usedAt)
            throw new common_1.BadRequestException('Token já utilizado');
        const ageMs = Date.now() - new Date(signatureToken.createdAt).getTime();
        if (ageMs > SIGNATURE_TOKEN_TTL_MS) {
            throw new common_1.BadRequestException('Token expirado');
        }
        if (!body?.imageBase64 || typeof body.imageBase64 !== 'string') {
            throw new common_1.BadRequestException('Assinatura inválida');
        }
        if (body.imageBase64.length > MAX_BASE64_BYTES) {
            throw new common_1.BadRequestException('Imagem excede limite');
        }
        const consumed = await this.signatureTokensRepository.consume(token);
        if (consumed.count === 0)
            throw new common_1.BadRequestException('Token já utilizado');
        const signatureBuffer = Buffer.from(body.imageBase64, 'base64');
        const fileUrl = await this.s3Service.uploadFile(`${token}.png`, signatureBuffer);
        return this.medicalRecordsRepository.createAttachment({
            medicalRecordId: signatureToken.medicalRecordId,
            fileUrl,
            category: `${attachment_category_enum_1.AttachmentCategory.ELECTRONIC_SIGNATURE}|${ipAddress}|${body.latitude ?? ''}|${body.longitude ?? ''}`,
        });
    }
};
exports.SignaturesService = SignaturesService;
exports.SignaturesService = SignaturesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(signature_tokens_repository_interface_1.SIGNATURE_TOKENS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(medical_records_repository_interface_1.MEDICAL_RECORDS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, s3_service_1.S3Service])
], SignaturesService);
//# sourceMappingURL=signatures.service.js.map