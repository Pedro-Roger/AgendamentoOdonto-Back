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
exports.WhatsAppConfigController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/auth/jwt-auth.guard");
const roles_guard_1 = require("../common/auth/roles.guard");
const roles_decorator_1 = require("../common/auth/roles.decorator");
const whatsapp_config_repository_1 = require("./whatsapp-config.repository");
const whatsapp_service_1 = require("./whatsapp.service");
const class_validator_1 = require("class-validator");
class SaveWhatsAppConfigDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "instanceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "clinicName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "clinicAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveWhatsAppConfigDto.prototype, "isActive", void 0);
class TestMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestMessageDto.prototype, "phone", void 0);
let WhatsAppConfigController = class WhatsAppConfigController {
    constructor(configRepo, whatsAppService) {
        this.configRepo = configRepo;
        this.whatsAppService = whatsAppService;
    }
    getConfig() {
        return this.configRepo.findFirst();
    }
    saveConfig(body) {
        return this.configRepo.upsert({
            instanceId: body.instanceId,
            token: body.token,
            clinicName: body.clinicName,
            clinicAddress: body.clinicAddress,
            isActive: body.isActive ?? true,
        });
    }
    async testMessage(body) {
        const sent = await this.whatsAppService.sendText(body.phone, '✅ Teste de conexão da *Clínica Sorriso*. WhatsApp configurado com sucesso! 🦷');
        return { sent };
    }
};
exports.WhatsAppConfigController = WhatsAppConfigController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsAppConfigController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SaveWhatsAppConfigDto]),
    __metadata("design:returntype", void 0)
], WhatsAppConfigController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TestMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsAppConfigController.prototype, "testMessage", null);
exports.WhatsAppConfigController = WhatsAppConfigController = __decorate([
    (0, common_1.Controller)('api/whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MASTER'),
    __metadata("design:paramtypes", [whatsapp_config_repository_1.WhatsAppConfigRepository,
        whatsapp_service_1.WhatsAppService])
], WhatsAppConfigController);
//# sourceMappingURL=whatsapp-config.controller.js.map