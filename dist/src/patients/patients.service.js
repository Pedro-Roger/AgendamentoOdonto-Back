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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const patients_repository_interface_1 = require("./repositories/patients.repository.interface");
const appointments_repository_interface_1 = require("../appointments/repositories/appointments.repository.interface");
const medical_records_repository_interface_1 = require("../medical-records/repositories/medical-records.repository.interface");
const timeline_event_type_enum_1 = require("../common/enums/timeline-event-type.enum");
let PatientsService = class PatientsService {
    constructor(patientsRepository, appointmentsRepository, medicalRecordsRepository) {
        this.patientsRepository = patientsRepository;
        this.appointmentsRepository = appointmentsRepository;
        this.medicalRecordsRepository = medicalRecordsRepository;
    }
    list(q) {
        return this.patientsRepository.findAll(q);
    }
    async profile(id) {
        const patient = await this.patientsRepository.findById(id);
        if (!patient)
            throw new common_1.NotFoundException('Paciente não encontrado');
        return patient;
    }
    async timeline(id) {
        const [appointments, medicalRecords] = await Promise.all([
            this.appointmentsRepository.findByPatient(id),
            this.medicalRecordsRepository.findByPatient(id),
        ]);
        const appointmentEvents = appointments.map((a) => ({
            id: a.id,
            type: timeline_event_type_enum_1.TimelineEventType.APPOINTMENT,
            title: `Consulta ${a.time ?? ''}`,
            date: a.date ?? '',
        }));
        const recordEvents = medicalRecords.map((r) => ({
            id: r.id,
            type: timeline_event_type_enum_1.TimelineEventType.MEDICAL_RECORD,
            title: 'Prontuário',
            date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
        }));
        return [...appointmentEvents, ...recordEvents].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(patients_repository_interface_1.PATIENTS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(appointments_repository_interface_1.APPOINTMENTS_REPOSITORY)),
    __param(2, (0, common_1.Inject)(medical_records_repository_interface_1.MEDICAL_RECORDS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], PatientsService);
//# sourceMappingURL=patients.service.js.map