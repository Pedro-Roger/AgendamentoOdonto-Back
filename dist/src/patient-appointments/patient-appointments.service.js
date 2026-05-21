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
exports.PatientAppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatientAppointmentsService = class PatientAppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAvailableSchedules(serviceId, date) {
        const targetDate = new Date(`${date}T00:00:00`);
        const weekDay = targetDate.getDay();
        const schedules = await this.prisma.schedule.findMany({ where: { weekDay } });
        const appointments = await this.prisma.appointment.findMany({ where: { serviceId, date } });
        const bookedTimes = new Set(appointments.map((appointment) => appointment.time));
        return schedules.filter((schedule) => !bookedTimes.has(schedule.startTime));
    }
    async createAppointment(payload) {
        return this.prisma.$transaction(async (tx) => {
            const existingPatient = await tx.patient.findUnique({ where: { cpf: payload.cpf } });
            const patient = existingPatient ??
                (await tx.patient.create({
                    data: { name: payload.name, cpf: payload.cpf, email: payload.email, phone: payload.phone },
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientAppointmentsService);
//# sourceMappingURL=patient-appointments.service.js.map