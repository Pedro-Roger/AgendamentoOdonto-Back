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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const appointments_repository_interface_1 = require("./repositories/appointments.repository.interface");
let AppointmentsService = class AppointmentsService {
    constructor(appointmentsRepository) {
        this.appointmentsRepository = appointmentsRepository;
    }
    async findByDateRange(from, to, tenantId) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new common_1.BadRequestException('Datas inválidas');
        }
        if (toDate < fromDate) {
            throw new common_1.BadRequestException('Data final deve ser maior ou igual à data inicial');
        }
        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 31) {
            throw new common_1.BadRequestException('Intervalo máximo de 31 dias');
        }
        return this.appointmentsRepository.findByDateRange(from, to, tenantId);
    }
    async listByDate(date, tenantId) {
        const appointments = await this.appointmentsRepository.findByDateWithRelations(date, tenantId);
        return appointments.map((a) => ({
            id: a.id,
            date: a.date,
            time: a.time,
            patient: a.patient,
            service: a.service,
        }));
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(appointments_repository_interface_1.APPOINTMENTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map