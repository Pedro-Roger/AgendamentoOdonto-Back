"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordsModule = void 0;
const common_1 = require("@nestjs/common");
const medical_records_controller_1 = require("./medical-records.controller");
const medical_records_service_1 = require("./medical-records.service");
const prisma_service_1 = require("../prisma/prisma.service");
const s3_service_1 = require("../shared/s3.service");
let MedicalRecordsModule = class MedicalRecordsModule {
};
exports.MedicalRecordsModule = MedicalRecordsModule;
exports.MedicalRecordsModule = MedicalRecordsModule = __decorate([
    (0, common_1.Module)({
        controllers: [medical_records_controller_1.MedicalRecordsController],
        providers: [medical_records_service_1.MedicalRecordsService, prisma_service_1.PrismaService, s3_service_1.S3Service],
    })
], MedicalRecordsModule);
//# sourceMappingURL=medical-records.module.js.map