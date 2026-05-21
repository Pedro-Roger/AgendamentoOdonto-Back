"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
describe('Feature 02 - Agendamento pelo Paciente', () => {
    let app;
    const patients = [];
    const appointments = [];
    const tx = {
        patient: {
            findUnique: jest.fn(({ where }) => patients.find((patient) => patient.cpf === where.cpf) ?? null),
            create: jest.fn(({ data }) => {
                const patient = { id: `pat_${patients.length + 1}`, ...data };
                patients.push(patient);
                return patient;
            }),
        },
        appointment: {
            create: jest.fn(({ data }) => {
                const appointment = { id: `apt_${appointments.length + 1}`, ...data };
                appointments.push(appointment);
                return appointment;
            }),
        },
    };
    const prismaMock = {
        schedule: { findMany: jest.fn(() => [{ weekDay: 3, startTime: '09:00', endTime: '10:00' }]) },
        appointment: { findMany: jest.fn(() => []) },
        $transaction: jest.fn((callback) => callback(tx)),
    };
    beforeAll(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(prismaMock)
            .compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('GET /api/public/available-schedules retorna horarios disponiveis', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .get('/api/public/available-schedules')
            .query({ serviceId: 'svc_1', date: '2026-05-20' })
            .expect(200);
    });
    it('POST /api/public/appointments cria paciente por CPF e agenda', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/public/appointments')
            .send({
            name: 'Maria',
            cpf: '12345678901',
            email: 'maria@email.com',
            phone: '11999999999',
            serviceId: 'svc_1',
            date: '2026-05-20',
            time: '09:00',
            anamnesisAnswers: [{ key: 'dor', value: 'sim' }],
        })
            .expect(201);
    });
});
//# sourceMappingURL=feature-02-agendamento.spec.js.map