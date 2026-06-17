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
exports.ClinicConfigService = void 0;
const common_1 = require("@nestjs/common");
const services_repository_interface_1 = require("./repositories/services.repository.interface");
const schedules_repository_interface_1 = require("./repositories/schedules.repository.interface");
const form_settings_repository_interface_1 = require("./repositories/form-settings.repository.interface");
let ClinicConfigService = class ClinicConfigService {
    constructor(servicesRepository, schedulesRepository, formSettingsRepository) {
        this.servicesRepository = servicesRepository;
        this.schedulesRepository = schedulesRepository;
        this.formSettingsRepository = formSettingsRepository;
    }
    createService(data, tenantId) {
        return this.servicesRepository.create(data, tenantId);
    }
    listActiveServices(tenantId) {
        return this.servicesRepository.findActive(tenantId);
    }
    updateService(id, data, tenantId) {
        return this.servicesRepository.update(id, data, tenantId);
    }
    createSchedule(data, tenantId) {
        return this.schedulesRepository.create(data, tenantId);
    }
    listSchedules(tenantId) {
        return this.schedulesRepository.findAll(tenantId);
    }
    replaceSchedules(schedules, tenantId) {
        return this.schedulesRepository.replaceAll(schedules, tenantId);
    }
    createFormSettings(fields, tenantId) {
        return this.formSettingsRepository.create(fields, tenantId);
    }
    getFormSettings(tenantId) {
        return this.formSettingsRepository.findLatest(tenantId);
    }
};
exports.ClinicConfigService = ClinicConfigService;
exports.ClinicConfigService = ClinicConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(services_repository_interface_1.SERVICES_REPOSITORY)),
    __param(1, (0, common_1.Inject)(schedules_repository_interface_1.SCHEDULES_REPOSITORY)),
    __param(2, (0, common_1.Inject)(form_settings_repository_interface_1.FORM_SETTINGS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ClinicConfigService);
//# sourceMappingURL=clinic-config.service.js.map