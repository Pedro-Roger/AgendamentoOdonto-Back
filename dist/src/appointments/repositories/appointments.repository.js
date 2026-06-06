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
exports.AppointmentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AppointmentsRepository = class AppointmentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByDateWithRelations(date) {
        return this.prisma.appointment.findMany({
            where: { date },
            orderBy: { time: 'asc' },
            include: {
                patient: { select: { id: true, name: true, cpf: true, email: true, phone: true } },
                service: { select: { id: true, name: true, durationMinutes: true } },
            },
        });
    }
    findByDateRange(from, to) {
        return this.prisma.appointment.findMany({
            where: { date: { gte: from, lte: to } },
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
            include: {
                patient: { select: { id: true, name: true, cpf: true, email: true, phone: true } },
                service: { select: { id: true, name: true, durationMinutes: true } },
            },
        });
    }
    findByServiceAndDate(serviceId, date) {
        return this.prisma.appointment.findMany({ where: { serviceId, date } });
    }
    findByPatient(patientId) {
        return this.prisma.appointment.findMany({
            where: { patientId },
            orderBy: { date: 'desc' },
        });
    }
    create(data, tx) {
        const client = tx ?? this.prisma;
        return client.appointment.create({ data });
    }
};
exports.AppointmentsRepository = AppointmentsRepository;
exports.AppointmentsRepository = AppointmentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsRepository);
//# sourceMappingURL=appointments.repository.js.map