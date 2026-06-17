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
exports.PatientAppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const patient_appointments_service_1 = require("./patient-appointments.service");
const tenants_service_1 = require("../tenants/tenants.service");
let PatientAppointmentsController = class PatientAppointmentsController {
    constructor(patientAppointmentsService, tenants) {
        this.patientAppointmentsService = patientAppointmentsService;
        this.tenants = tenants;
    }
    async listServices(slug) {
        const tenant = await this.tenants.resolveBySlug(slug);
        return this.patientAppointmentsService.listActiveServices(tenant.id);
    }
    async getFormSettings(slug) {
        const tenant = await this.tenants.resolveBySlug(slug);
        return this.patientAppointmentsService.getFormSettings(tenant.id);
    }
    async getAvailableSchedules(slug, serviceId, date) {
        const tenant = await this.tenants.resolveBySlug(slug);
        return this.patientAppointmentsService.getAvailableSchedules(tenant.id, serviceId, date);
    }
    async create(slug, body) {
        const tenant = await this.tenants.resolveBySlug(slug);
        return this.patientAppointmentsService.createAppointment(tenant.id, body, 'PUBLIC');
    }
};
exports.PatientAppointmentsController = PatientAppointmentsController;
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientAppointmentsController.prototype, "listServices", null);
__decorate([
    (0, common_1.Get)('form-settings'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientAppointmentsController.prototype, "getFormSettings", null);
__decorate([
    (0, common_1.Get)('available-schedules'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('serviceId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PatientAppointmentsController.prototype, "getAvailableSchedules", null);
__decorate([
    (0, common_1.Post)('appointments'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", Promise)
], PatientAppointmentsController.prototype, "create", null);
exports.PatientAppointmentsController = PatientAppointmentsController = __decorate([
    (0, common_1.Controller)('api/public/:slug'),
    __metadata("design:paramtypes", [patient_appointments_service_1.PatientAppointmentsService,
        tenants_service_1.TenantsService])
], PatientAppointmentsController);
//# sourceMappingURL=patient-appointments.controller.js.map