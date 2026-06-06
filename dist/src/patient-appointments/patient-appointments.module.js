"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientAppointmentsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const patient_appointments_controller_1 = require("./patient-appointments.controller");
const patient_appointments_service_1 = require("./patient-appointments.service");
const schedules_repository_1 = require("../clinic-config/repositories/schedules.repository");
const schedules_repository_interface_1 = require("../clinic-config/repositories/schedules.repository.interface");
const services_repository_1 = require("../clinic-config/repositories/services.repository");
const services_repository_interface_1 = require("../clinic-config/repositories/services.repository.interface");
const form_settings_repository_1 = require("../clinic-config/repositories/form-settings.repository");
const form_settings_repository_interface_1 = require("../clinic-config/repositories/form-settings.repository.interface");
const appointments_repository_1 = require("../appointments/repositories/appointments.repository");
const appointments_repository_interface_1 = require("../appointments/repositories/appointments.repository.interface");
const notifications_module_1 = require("../notifications/notifications.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let PatientAppointmentsModule = class PatientAppointmentsModule {
};
exports.PatientAppointmentsModule = PatientAppointmentsModule;
exports.PatientAppointmentsModule = PatientAppointmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, whatsapp_module_1.WhatsAppModule],
        controllers: [patient_appointments_controller_1.PatientAppointmentsController],
        providers: [
            patient_appointments_service_1.PatientAppointmentsService,
            prisma_service_1.PrismaService,
            { provide: schedules_repository_interface_1.SCHEDULES_REPOSITORY, useClass: schedules_repository_1.SchedulesRepository },
            { provide: services_repository_interface_1.SERVICES_REPOSITORY, useClass: services_repository_1.ServicesRepository },
            { provide: form_settings_repository_interface_1.FORM_SETTINGS_REPOSITORY, useClass: form_settings_repository_1.FormSettingsRepository },
            { provide: appointments_repository_interface_1.APPOINTMENTS_REPOSITORY, useClass: appointments_repository_1.AppointmentsRepository },
        ],
    })
], PatientAppointmentsModule);
//# sourceMappingURL=patient-appointments.module.js.map