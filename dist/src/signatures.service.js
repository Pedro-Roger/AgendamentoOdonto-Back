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
exports.SignaturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
const s3_service_1 = require("./shared/s3.service");
const attachment_category_enum_1 = require("./common/enums/attachment-category.enum");
let SignaturesService = class SignaturesService {
    constructor(prisma, s3Service) {
        this.prisma = prisma;
        this.s3Service = s3Service;
    }
    async uploadPhysical(medicalRecordId, file) {
        const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
        return this.prisma.medicalRecordAttachment.create({
            data: { medicalRecordId, fileUrl, category: attachment_category_enum_1.AttachmentCategory.PHYSICAL_SIGNATURE },
        });
    }
    generateElectronicLink(medicalRecordId) {
        const token = `sig_${Date.now()}`;
        return this.prisma.signatureToken.create({ data: { token, medicalRecordId } });
    }
    async submitElectronic(token, body, ipAddress) {
        const signatureToken = await this.prisma.signatureToken.findUnique({ where: { token } });
        const signatureBuffer = Buffer.from(body.imageBase64, 'base64');
        const fileUrl = await this.s3Service.uploadFile(`${token}.png`, signatureBuffer);
        await this.prisma.signatureToken.update({ where: { token }, data: { usedAt: new Date() } });
        return this.prisma.medicalRecordAttachment.create({
            data: {
                medicalRecordId: signatureToken.medicalRecordId,
                fileUrl,
                category: `${attachment_category_enum_1.AttachmentCategory.ELECTRONIC_SIGNATURE}|${ipAddress}|${body.latitude}|${body.longitude}`,
            },
        });
    }
};
exports.SignaturesService = SignaturesService;
exports.SignaturesService = SignaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        s3_service_1.S3Service])
], SignaturesService);
//# sourceMappingURL=signatures.service.js.map