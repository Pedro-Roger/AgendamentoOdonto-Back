"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const s3_service_1 = require("../src/shared/s3.service");
describe('Feature 03 - Prontuario Digital', () => {
    let app;
    const prismaMock = {
        medicalRecord: {
            create: jest.fn(({ data }) => ({ id: 'mr_1', patientId: data.patientId ?? 'p_1', content: data.content ?? {}, version: data.version ?? 1, updatedAt: new Date() })),
            findUnique: jest.fn(() => ({ id: 'mr_1', patientId: 'p_1', content: { queixa: 'dor' }, version: 1, updatedAt: new Date() })),
            findFirst: jest.fn(() => null),
            update: jest.fn(({ data }) => ({ id: 'mr_1', patientId: 'p_1', ...data, updatedAt: new Date() })),
            findMany: jest.fn(() => []),
        },
        medicalRecordAttachment: {
            create: jest.fn(({ data }) => ({ id: 'att_1', ...data })),
            findMany: jest.fn(() => []),
        },
        notification: {
            create: jest.fn(() => ({})),
            findMany: jest.fn(() => []),
        },
        whatsAppConfig: {
            findFirst: jest.fn(() => null),
        },
        appointmentReminder: {
            findUnique: jest.fn(() => null),
        },
    };
    const s3Mock = {
        uploadFile: jest.fn(() => 'https://s3.local/raio-x.png'),
        getSignedUrl: jest.fn((url) => url),
    };
    beforeAll(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(prismaMock)
            .overrideProvider(s3_service_1.S3Service)
            .useValue(s3Mock)
            .compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('POST /api/medical-records cria ou atualiza prontuario por paciente', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/medical-records')
            .send({ patientId: 'p_1', content: {} })
            .expect(201);
    });
    it('GET /api/medical-records/:id retorna prontuario', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/medical-records/mr_1').expect(200);
    });
    it('GET /api/medical-records/patient/:patientId retorna prontuario do paciente', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/medical-records/patient/p_1').expect(200);
    });
    it('POST /api/medical-records/:id/attachments recebe multipart', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/medical-records/mr_1/attachments')
            .attach('file', Buffer.from('fake-img'), 'raio-x.png')
            .expect(201);
    });
});
//# sourceMappingURL=feature-03-prontuario.spec.js.map