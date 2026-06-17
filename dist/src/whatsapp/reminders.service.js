"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_config_repository_1 = require("./whatsapp-config.repository");
const baileys_service_1 = require("./baileys.service");
const crypto = __importStar(require("crypto"));
let RemindersService = RemindersService_1 = class RemindersService {
    constructor(prisma, whatsApp, configRepo, baileys) {
        this.prisma = prisma;
        this.whatsApp = whatsApp;
        this.configRepo = configRepo;
        this.baileys = baileys;
        this.logger = new common_1.Logger(RemindersService_1.name);
    }
    async sendDailyReminders() {
        if (this.baileys.getStatus() !== 'connected') {
            this.logger.log('Lembretes: WhatsApp não conectado, pulando.');
            return;
        }
        const tomorrow = this.tomorrowIso();
        const appointments = await this.prisma.appointment.findMany({
            where: { date: tomorrow, reminder: null },
            include: { patient: true, service: true },
        });
        this.logger.log(`Lembretes: ${appointments.length} consultas amanhã (${tomorrow})`);
        const baseUrl = process.env.APP_URL ?? 'https://app.sorriso.com.br';
        const configByTenant = new Map();
        for (const appt of appointments) {
            if (!appt.patient.phone)
                continue;
            let config = configByTenant.get(appt.tenantId);
            if (!config) {
                const found = await this.configRepo.findFirst(appt.tenantId);
                config = {
                    clinicName: found?.clinicName ?? 'Clínica',
                    clinicAddress: found?.clinicAddress ?? '',
                };
                configByTenant.set(appt.tenantId, config);
            }
            const token = crypto.randomBytes(20).toString('hex');
            const message = this.whatsApp.buildReminderMessage({
                patientName: appt.patient.name,
                serviceName: appt.service.name,
                date: appt.date,
                time: appt.time,
                clinicName: config.clinicName,
                clinicAddress: config.clinicAddress,
                confirmationToken: token,
                baseUrl,
            });
            const sent = await this.whatsApp.sendText(appt.patient.phone, message);
            if (sent) {
                await this.prisma.appointmentReminder.create({
                    data: {
                        id: crypto.randomBytes(12).toString('hex'),
                        appointmentId: appt.id,
                        token,
                    },
                });
                this.logger.log(`Lembrete enviado: ${appt.patient.name} (${appt.id})`);
            }
        }
    }
    async confirmAppointment(token) {
        const reminder = await this.prisma.appointmentReminder.findUnique({ where: { token } });
        if (!reminder || reminder.confirmedAt)
            return false;
        await this.prisma.appointmentReminder.update({
            where: { token },
            data: { confirmedAt: new Date() },
        });
        return true;
    }
    tomorrowIso() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    }
};
exports.RemindersService = RemindersService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *', { name: 'appointment-reminders', timeZone: 'America/Sao_Paulo' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "sendDailyReminders", null);
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService,
        whatsapp_config_repository_1.WhatsAppConfigRepository,
        baileys_service_1.BaileysService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map