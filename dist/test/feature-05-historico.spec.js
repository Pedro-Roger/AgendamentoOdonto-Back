"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
describe('Feature 05 - Historico Paciente', () => {
    let app;
    const prismaMock = {
        patient: { findMany: jest.fn(() => [{ id: 'pat_1', name: 'Maria', cpf: '123' }]), findUnique: jest.fn(() => ({ id: 'pat_1' })) },
        appointment: { findMany: jest.fn(() => [{ id: 'apt_1', patientId: 'pat_1' }]) },
        medicalRecord: { findMany: jest.fn(() => [{ id: 'mr_1', version: 1 }]) },
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
    it('GET /api/patients', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/patients').expect(200);
    });
    it('GET /api/patients/:id/profile', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/patients/pat_1/profile').expect(200);
    });
    it('GET /api/patients/:id/timeline', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/patients/pat_1/timeline').expect(200);
    });
});
//# sourceMappingURL=feature-05-historico.spec.js.map