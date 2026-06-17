"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const integrations_controller_1 = require("./integrations.controller");
const api_key_guard_1 = require("../common/auth/api-key.guard");
const api_keys_module_1 = require("../api-keys/api-keys.module");
const patient_appointments_module_1 = require("../patient-appointments/patient-appointments.module");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [api_keys_module_1.ApiKeysModule, patient_appointments_module_1.PatientAppointmentsModule],
        controllers: [integrations_controller_1.IntegrationsController],
        providers: [api_key_guard_1.ApiKeyGuard],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map