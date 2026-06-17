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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary(tenantId, from, to) {
        const where = { tenantId, date: { gte: from, lte: to } };
        const [totalAppointments, newPatients, rows] = await Promise.all([
            this.prisma.appointment.count({ where }),
            this.prisma.patient.count({ where: { tenantId } }),
            this.prisma.appointment.findMany({
                where,
                select: { date: true, source: true, service: { select: { name: true } } },
            }),
        ]);
        const byKey = (arr, key) => {
            const map = new Map();
            for (const r of arr)
                map.set(key(r), (map.get(key(r)) ?? 0) + 1);
            return [...map.entries()];
        };
        return {
            totalAppointments,
            newPatients,
            revenue: 0,
            appointmentsByDay: byKey(rows, (r) => r.date).map(([date, count]) => ({ date, count })),
            appointmentsByService: byKey(rows, (r) => r.service?.name ?? '—').map(([name, count]) => ({ name, count })),
            appointmentsBySource: byKey(rows, (r) => r.source).map(([source, count]) => ({ source, count })),
            upcomingToday: 0,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map