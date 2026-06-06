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
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const baileys_service_1 = require("./baileys.service");
let WhatsAppService = class WhatsAppService {
    constructor(baileys) {
        this.baileys = baileys;
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
        return this.baileys.sendText(phone, message);
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [baileys_service_1.BaileysService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map