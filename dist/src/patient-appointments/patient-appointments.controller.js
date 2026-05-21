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
let PatientAppointmentsController = class PatientAppointmentsController {
    constructor(patientAppointmentsService) {
        this.patientAppointmentsService = patientAppointmentsService;
    }
    getAvailableSchedules(serviceId, date) {
        return this.patientAppointmentsService.getAvailableSchedules(serviceId, date);
    }
    createAppointment(body) {
        return this.patientAppointmentsService.createAppointment(body);
    }
};
exports.PatientAppointmentsController = PatientAppointmentsController;
__decorate([
    (0, common_1.Get)('available-schedules'),
    __param(0, (0, common_1.Query)('serviceId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PatientAppointmentsController.prototype, "getAvailableSchedules", null);
__decorate([
    (0, common_1.Post)('appointments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], PatientAppointmentsController.prototype, "createAppointment", null);
exports.PatientAppointmentsController = PatientAppointmentsController = __decorate([
    (0, common_1.Controller)('api/public'),
    __metadata("design:paramtypes", [patient_appointments_service_1.PatientAppointmentsService])
], PatientAppointmentsController);
//# sourceMappingURL=patient-appointments.controller.js.map