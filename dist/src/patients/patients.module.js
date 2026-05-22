"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const patients_controller_1 = require("./patients.controller");
const patients_service_1 = require("./patients.service");
const prisma_service_1 = require("../prisma/prisma.service");
const patients_repository_1 = require("./repositories/patients.repository");
const patients_repository_interface_1 = require("./repositories/patients.repository.interface");
const appointments_repository_1 = require("../appointments/repositories/appointments.repository");
const appointments_repository_interface_1 = require("../appointments/repositories/appointments.repository.interface");
const medical_records_repository_1 = require("../medical-records/repositories/medical-records.repository");
const medical_records_repository_interface_1 = require("../medical-records/repositories/medical-records.repository.interface");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        controllers: [patients_controller_1.PatientsController],
        providers: [
            patients_service_1.PatientsService,
            prisma_service_1.PrismaService,
            { provide: patients_repository_interface_1.PATIENTS_REPOSITORY, useClass: patients_repository_1.PatientsRepository },
            { provide: appointments_repository_interface_1.APPOINTMENTS_REPOSITORY, useClass: appointments_repository_1.AppointmentsRepository },
            { provide: medical_records_repository_interface_1.MEDICAL_RECORDS_REPOSITORY, useClass: medical_records_repository_1.MedicalRecordsRepository },
        ],
        exports: [patients_repository_interface_1.PATIENTS_REPOSITORY],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map