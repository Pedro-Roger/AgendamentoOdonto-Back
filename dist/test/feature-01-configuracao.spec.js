"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
describe('Feature 01 - Configuracao da Clinica', () => {
    let app;
    const services = [];
    const schedules = [];
    const formSettings = [];
    const prismaMock = {
        service: {
            create: jest.fn(({ data }) => {
                const item = { id: `svc_${services.length + 1}`, isActive: true, ...data };
                services.push(item);
                return item;
            }),
            findMany: jest.fn(() => services.filter((service) => service.isActive)),
            update: jest.fn(({ where, data }) => {
                const current = services.find((service) => service.id === where.id);
                if (!current) {
                    throw new Error('Service not found');
                }
                Object.assign(current, data);
                return current;
            }),
        },
        schedule: {
            create: jest.fn(({ data }) => {
                const item = { id: `sch_${schedules.length + 1}`, ...data };
                schedules.push(item);
                return item;
            }),
            findMany: jest.fn(() => schedules),
        },
        formSetting: {
            create: jest.fn(({ data }) => {
                const item = { id: `frm_${formSettings.length + 1}`, ...data };
                formSettings.push(item);
                return item;
            }),
        },
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
    it('POST /api/services deve criar servico', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/services')
            .send({ name: 'Limpeza', durationMinutes: 30 })
            .expect(201);
    });
    it('GET /api/services deve listar servicos ativos', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/services').expect(200);
    });
    it('PUT /api/services/:id deve atualizar/inativar', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).put('/api/services/svc_1').send({ isActive: false }).expect(200);
    });
    it('POST /api/schedules deve cadastrar horario', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/schedules')
            .send({ weekDay: 1, startTime: '08:00', endTime: '17:00' })
            .expect(201);
    });
    it('GET /api/schedules deve listar horarios', async () => {
        await (0, supertest_1.default)(app.getHttpServer()).get('/api/schedules').expect(200);
    });
    it('POST /api/form-settings deve salvar configuracao', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/api/form-settings')
            .send({ fields: [{ key: 'alergia', label: 'Possui alergia?', type: 'boolean' }] })
            .expect(201);
    });
});
//# sourceMappingURL=feature-01-configuracao.spec.js.map