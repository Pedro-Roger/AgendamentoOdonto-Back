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
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const jwt_auth_guard_1 = require("../common/auth/jwt-auth.guard");
const roles_guard_1 = require("../common/auth/roles.guard");
const roles_decorator_1 = require("../common/auth/roles.decorator");
const whatsapp_config_repository_1 = require("./whatsapp-config.repository");
const whatsapp_service_1 = require("./whatsapp.service");
const baileys_service_1 = require("./baileys.service");
const class_validator_1 = require("class-validator");
class SaveWhatsAppConfigDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "clinicName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveWhatsAppConfigDto.prototype, "clinicAddress", void 0);
class TestMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestMessageDto.prototype, "phone", void 0);
let WhatsAppConfigController = class WhatsAppConfigController {
    constructor(configRepo, whatsAppService, baileys) {
        this.configRepo = configRepo;
        this.whatsAppService = whatsAppService;
        this.baileys = baileys;
    }
    getStatus() {
        return {
            status: this.baileys.getStatus(),
            qr: this.baileys.getQr(),
        };
    }
    getConfig(user) {
        return this.configRepo.findFirst(user.tenantId);
    }
    saveConfig(user, body) {
        return this.configRepo.upsert({
            instanceId: '',
            token: '',
            clinicName: body.clinicName,
            clinicAddress: body.clinicAddress,
            isActive: true,
        }, user.tenantId);
    }
    async resetSession() {
        await this.baileys.disconnect();
        return { ok: true };
    }
    async testMessage(body) {
        const sent = await this.whatsAppService.sendText(body.phone, '✅ Teste de conexão da *Clínica Sorriso*. WhatsApp via Baileys funcionando! 🦷');
        return { sent };
    }
};
exports.WhatsAppConfigController = WhatsAppConfigController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsAppConfigController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WhatsAppConfigController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SaveWhatsAppConfigDto]),
    __metadata("design:returntype", void 0)
], WhatsAppConfigController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Delete)('session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppConfigController.prototype, "resetSession", null);
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
        whatsapp_service_1.WhatsAppService,
        baileys_service_1.BaileysService])
], WhatsAppConfigController);
//# sourceMappingURL=whatsapp-config.controller.js.map