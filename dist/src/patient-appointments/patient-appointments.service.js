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
exports.PatientAppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedules_repository_interface_1 = require("../clinic-config/repositories/schedules.repository.interface");
const services_repository_interface_1 = require("../clinic-config/repositories/services.repository.interface");
const form_settings_repository_interface_1 = require("../clinic-config/repositories/form-settings.repository.interface");
const appointments_repository_interface_1 = require("../appointments/repositories/appointments.repository.interface");
let PatientAppointmentsService = class PatientAppointmentsService {
    constructor(prisma, schedulesRepository, servicesRepository, formSettingsRepository, appointmentsRepository) {
        this.prisma = prisma;
        this.schedulesRepository = schedulesRepository;
        this.servicesRepository = servicesRepository;
        this.formSettingsRepository = formSettingsRepository;
        this.appointmentsRepository = appointmentsRepository;
    }
    listActiveServices() {
        return this.servicesRepository.findActive();
    }
    getFormSettings() {
        return this.formSettingsRepository.findLatest();
    }
    async getAvailableSchedules(serviceId, date) {
        const weekDay = new Date(`${date}T00:00:00`).getDay();
        const [schedules, appointments] = await Promise.all([
            this.schedulesRepository.findByWeekDay(weekDay),
            this.appointmentsRepository.findByServiceAndDate(serviceId, date),
        ]);
        const bookedTimes = new Set(appointments.map((a) => a.time));
        return schedules.filter((s) => !bookedTimes.has(s.startTime));
    }
    async createAppointment(payload) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.patient.findUnique({ where: { cpf: payload.cpf } });
            const patient = existing ??
                (await tx.patient.create({
                    data: {
                        name: payload.name,
                        cpf: payload.cpf,
                        email: payload.email,
                        phone: payload.phone,
                    },
                }));
            return tx.appointment.create({
                data: {
                    patientId: patient.id,
                    serviceId: payload.serviceId,
                    date: payload.date,
                    time: payload.time,
                    anamnesisAnswers: payload.anamnesisAnswers,
                },
            });
        });
    }
};
exports.PatientAppointmentsService = PatientAppointmentsService;
exports.PatientAppointmentsService = PatientAppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(schedules_repository_interface_1.SCHEDULES_REPOSITORY)),
    __param(2, (0, common_1.Inject)(services_repository_interface_1.SERVICES_REPOSITORY)),
    __param(3, (0, common_1.Inject)(form_settings_repository_interface_1.FORM_SETTINGS_REPOSITORY)),
    __param(4, (0, common_1.Inject)(appointments_repository_interface_1.APPOINTMENTS_REPOSITORY)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object, Object, Object])
], PatientAppointmentsService);
//# sourceMappingURL=patient-appointments.service.js.map