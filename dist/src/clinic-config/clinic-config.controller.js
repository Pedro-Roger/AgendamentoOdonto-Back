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
exports.ClinicConfigController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const jwt_auth_guard_1 = require("../common/auth/jwt-auth.guard");
const roles_guard_1 = require("../common/auth/roles.guard");
const roles_decorator_1 = require("../common/auth/roles.decorator");
const create_form_settings_dto_1 = require("./dto/create-form-settings.dto");
const create_schedule_dto_1 = require("./dto/create-schedule.dto");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const clinic_config_service_1 = require("./clinic-config.service");
let ClinicConfigController = class ClinicConfigController {
    constructor(clinicConfigService) {
        this.clinicConfigService = clinicConfigService;
    }
    createService(user, body) {
        return this.clinicConfigService.createService(body, user.tenantId);
    }
    listServices(user) {
        return this.clinicConfigService.listActiveServices(user.tenantId);
    }
    updateService(user, id, body) {
        return this.clinicConfigService.updateService(id, body, user.tenantId);
    }
    createSchedule(user, body) {
        return this.clinicConfigService.createSchedule(body, user.tenantId);
    }
    listSchedules(user) {
        return this.clinicConfigService.listSchedules(user.tenantId);
    }
    createFormSettings(user, body) {
        return this.clinicConfigService.createFormSettings(body.fields, user.tenantId);
    }
    getFormSettings(user) {
        return this.clinicConfigService.getFormSettings(user.tenantId);
    }
    replaceSchedules(user, body) {
        return this.clinicConfigService.replaceSchedules(body, user.tenantId);
    }
};
exports.ClinicConfigController = ClinicConfigController;
__decorate([
    (0, common_1.Post)('services'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_service_dto_1.CreateServiceDto]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "listServices", null);
__decorate([
    (0, common_1.Put)('services/:id'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_service_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "updateService", null);
__decorate([
    (0, common_1.Post)('schedules'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_schedule_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Get)('schedules'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "listSchedules", null);
__decorate([
    (0, common_1.Post)('form-settings'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_form_settings_dto_1.CreateFormSettingsDto]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "createFormSettings", null);
__decorate([
    (0, common_1.Get)('form-settings'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN', 'DENTISTA'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "getFormSettings", null);
__decorate([
    (0, common_1.Put)('schedules'),
    (0, roles_decorator_1.Roles)('MASTER', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], ClinicConfigController.prototype, "replaceSchedules", null);
exports.ClinicConfigController = ClinicConfigController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [clinic_config_service_1.ClinicConfigService])
], ClinicConfigController);
//# sourceMappingURL=clinic-config.controller.js.map