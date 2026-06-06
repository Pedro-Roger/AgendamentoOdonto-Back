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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_config_repository_1 = require("./whatsapp-config.repository");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(configRepo) {
        this.configRepo = configRepo;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
    }
    formatPhone(raw) {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('55') && digits.length >= 12)
            return digits;
        return `55${digits}`;
    }
    buildReminderMessage(params) {
        const confirmUrl = `${params.baseUrl}/confirmar-consulta/${params.confirmationToken}`;
        return [
            `Olá, *${params.patientName}*! 👋`,
            '',
            `Lembramos que você tem uma consulta *amanhã* na *${params.clinicName}*:`,
            '',
            `📋 *Serviço:* ${params.serviceName}`,
            `📅 *Data:* ${params.date}`,
            `🕐 *Horário:* ${params.time}`,
            `📍 *Local:* ${params.clinicAddress}`,
            '',
            `Para confirmar sua presença, responda *SIM* ou acesse:`,
            confirmUrl,
            '',
            `_Caso não possa comparecer, responda NÃO._`,
            `_Clínica ${params.clinicName}_ 🦷`,
        ].join('\n');
    }
    async sendText(phone, message) {
        const config = await this.configRepo.findActive();
        if (!config) {
            this.logger.warn('WhatsApp: nenhuma configuração ativa encontrada');
            return false;
        }
        const formattedPhone = this.formatPhone(phone);
        const url = `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-text`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone, message }),
            });
            if (!res.ok) {
                this.logger.error(`WhatsApp: Z-API respondeu ${res.status}`);
                return false;
            }
            return true;
        }
        catch (err) {
            this.logger.error('WhatsApp: falha ao enviar mensagem', err);
            return false;
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_config_repository_1.WhatsAppConfigRepository])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map