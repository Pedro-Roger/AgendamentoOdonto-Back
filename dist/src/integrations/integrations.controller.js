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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../common/auth/api-key.guard");
const patient_appointments_service_1 = require("../patient-appointments/patient-appointments.service");
const create_appointment_dto_1 = require("../patient-appointments/dto/create-appointment.dto");
let IntegrationsController = class IntegrationsController {
    constructor(appointments) {
        this.appointments = appointments;
    }
    services(req) {
        return this.appointments.listActiveServices(req.tenantId);
    }
    formSettings(req) {
        return this.appointments.getFormSettings(req.tenantId);
    }
    availability(req, serviceId, date) {
        return this.appointments.getAvailableSchedules(req.tenantId, serviceId, date);
    }
    async create(req, body) {
        const services = await this.appointments.listActiveServices(req.tenantId);
        const allowed = services.some((s) => s.id === body.serviceId);
        if (!allowed) {
            throw new common_1.BadRequestException('Serviço não pertence à companhia');
        }
        return this.appointments.createAppointment(req.tenantId, body, 'INTEGRATION', req.apiKeyId);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "services", null);
__decorate([
    (0, common_1.Get)('form-settings'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "formSettings", null);
__decorate([
    (0, common_1.Get)('availability'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('serviceId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "availability", null);
__decorate([
    (0, common_1.Post)('appointments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "create", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('api/integrations'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [patient_appointments_service_1.PatientAppointmentsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map