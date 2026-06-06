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
exports.SignaturesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("./common/auth/jwt-auth.guard");
const roles_decorator_1 = require("./common/auth/roles.decorator");
const roles_guard_1 = require("./common/auth/roles.guard");
const generate_electronic_link_dto_1 = require("./signatures/dto/generate-electronic-link.dto");
const submit_electronic_signature_dto_1 = require("./signatures/dto/submit-electronic-signature.dto");
const upload_physical_signature_dto_1 = require("./signatures/dto/upload-physical-signature.dto");
const signatures_service_1 = require("./signatures.service");
let SignaturesController = class SignaturesController {
    constructor(signaturesService) {
        this.signaturesService = signaturesService;
    }
    uploadPhysical(file, body) {
        return this.signaturesService.uploadPhysical(body.medicalRecordId, file);
    }
    generateElectronicLink(body) {
        return this.signaturesService.generateElectronicLink(body.medicalRecordId);
    }
    submitElectronic(token, body, ipAddress) {
        return this.signaturesService.submitElectronic(token, body, ipAddress);
    }
};
exports.SignaturesController = SignaturesController;
__decorate([
    (0, common_1.Post)('signatures/physical'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_physical_signature_dto_1.UploadPhysicalSignatureDto]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "uploadPhysical", null);
__decorate([
    (0, common_1.Post)('signatures/electronic/generate-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_electronic_link_dto_1.GenerateElectronicLinkDto]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "generateElectronicLink", null);
__decorate([
    (0, common_1.Post)('public/signatures/electronic/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_electronic_signature_dto_1.SubmitElectronicSignatureDto, String]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "submitElectronic", null);
exports.SignaturesController = SignaturesController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [signatures_service_1.SignaturesService])
], SignaturesController);
//# sourceMappingURL=signatures.controller.js.map