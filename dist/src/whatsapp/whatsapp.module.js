"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_config_repository_1 = require("./whatsapp-config.repository");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_config_controller_1 = require("./whatsapp-config.controller");
const reminders_service_1 = require("./reminders.service");
const baileys_service_1 = require("./baileys.service");
let WhatsAppModule = class WhatsAppModule {
};
exports.WhatsAppModule = WhatsAppModule;
exports.WhatsAppModule = WhatsAppModule = __decorate([
    (0, common_1.Module)({
        controllers: [whatsapp_config_controller_1.WhatsAppConfigController],
        providers: [
            prisma_service_1.PrismaService,
            whatsapp_config_repository_1.WhatsAppConfigRepository,
            baileys_service_1.BaileysService,
            whatsapp_service_1.WhatsAppService,
            reminders_service_1.RemindersService,
        ],
        exports: [whatsapp_service_1.WhatsAppService, reminders_service_1.RemindersService],
    })
], WhatsAppModule);
//# sourceMappingURL=whatsapp.module.js.map