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
describe('Feature 04 - Assinatura', () => {
    let app;
    const prismaMock = {
        signatureToken: {
            create: jest.fn(() => ({ token: 'token_1', medicalRecordId: 'mr_1', createdAt: new Date() })),
            findUnique: jest.fn(() => ({
                token: 'token_1',
                medicalRecordId: 'mr_1',
                usedAt: null,
                createdAt: new Date(),
            })),
            update: jest.fn(() => ({ token: 'token_1' })),
            updateMany: jest.fn(() => ({ count: 1 })),
        },
        medicalRecordAttachment: { create: jest.fn(() => ({ id: 'att_1' })) },
    };
    const s3Mock = { uploadFile: jest.fn(() => 'https://s3.local/assinatura.png') };
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
    it('POST /api/signatures/physical', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/signatures/physical')
            .field('medicalRecordId', 'mr_1')
            .attach('file', Buffer.from('signed-paper'), 'assinatura.jpg')
            .expect(201);
    });
    it('POST /api/signatures/electronic/generate-link', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).post('/api/signatures/electronic/generate-link').send({ medicalRecordId: 'mr_1' }).expect(201);
    });
    it('POST /api/public/signatures/electronic/:token', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/public/signatures/electronic/token_1')
            .send({ imageBase64: 'ZmFrZQ==', latitude: -23.5, longitude: -46.6 })
            .expect(201);
    });
});
//# sourceMappingURL=feature-04-assinatura.spec.js.map