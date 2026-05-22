"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicConfigModule = void 0;
const common_1 = require("@nestjs/common");
const clinic_config_controller_1 = require("./clinic-config.controller");
const clinic_config_service_1 = require("./clinic-config.service");
const prisma_service_1 = require("../prisma/prisma.service");
const services_repository_1 = require("./repositories/services.repository");
const services_repository_interface_1 = require("./repositories/services.repository.interface");
const schedules_repository_1 = require("./repositories/schedules.repository");
const schedules_repository_interface_1 = require("./repositories/schedules.repository.interface");
const form_settings_repository_1 = require("./repositories/form-settings.repository");
const form_settings_repository_interface_1 = require("./repositories/form-settings.repository.interface");
let ClinicConfigModule = class ClinicConfigModule {
};
exports.ClinicConfigModule = ClinicConfigModule;
exports.ClinicConfigModule = ClinicConfigModule = __decorate([
    (0, common_1.Module)({
        controllers: [clinic_config_controller_1.ClinicConfigController],
        providers: [
            clinic_config_service_1.ClinicConfigService,
            prisma_service_1.PrismaService,
            { provide: services_repository_interface_1.SERVICES_REPOSITORY, useClass: services_repository_1.ServicesRepository },
            { provide: schedules_repository_interface_1.SCHEDULES_REPOSITORY, useClass: schedules_repository_1.SchedulesRepository },
            { provide: form_settings_repository_interface_1.FORM_SETTINGS_REPOSITORY, useClass: form_settings_repository_1.FormSettingsRepository },
        ],
        exports: [services_repository_interface_1.SERVICES_REPOSITORY, schedules_repository_interface_1.SCHEDULES_REPOSITORY, form_settings_repository_interface_1.FORM_SETTINGS_REPOSITORY],
    })
], ClinicConfigModule);
//# sourceMappingURL=clinic-config.module.js.map