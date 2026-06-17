"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const clinic_config_module_1 = require("./clinic-config/clinic-config.module");
const patient_appointments_module_1 = require("./patient-appointments/patient-appointments.module");
const appointments_module_1 = require("./appointments/appointments.module");
const medical_records_module_1 = require("./medical-records/medical-records.module");
const signatures_module_1 = require("./signatures.module");
const patients_module_1 = require("./patients/patients.module");
const users_module_1 = require("./users/users.module");
const tenants_module_1 = require("./tenants/tenants.module");
const notifications_module_1 = require("./notifications/notifications.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const discord_module_1 = require("./common/discord/discord.module");
const api_keys_module_1 = require("./api-keys/api-keys.module");
const integrations_module_1 = require("./integrations/integrations.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 60_000, limit: 30 },
                { name: 'medium', ttl: 60 * 60_000, limit: 300 },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            clinic_config_module_1.ClinicConfigModule,
            patient_appointments_module_1.PatientAppointmentsModule,
            appointments_module_1.AppointmentsModule,
            medical_records_module_1.MedicalRecordsModule,
            signatures_module_1.SignaturesModule,
            patients_module_1.PatientsModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            notifications_module_1.NotificationsModule,
            whatsapp_module_1.WhatsAppModule,
            discord_module_1.DiscordModule,
            api_keys_module_1.ApiKeysModule,
            integrations_module_1.IntegrationsModule,
            dashboard_module_1.DashboardModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map