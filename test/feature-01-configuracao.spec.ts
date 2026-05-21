import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Feature 01 - Configuracao da Clinica', () => {
  let app: INestApplication;

  const services: Array<{ id: string; name: string; durationMinutes: number; isActive: boolean }> = [];
  const schedules: Array<{ id: string; weekDay: number; startTime: string; endTime: string }> = [];
  const formSettings: Array<{ id: string; fields: unknown }> = [];

  const prismaMock = {
    service: {
      create: jest.fn(({ data }: { data: { name: string; durationMinutes: number } }) => {
        const item = { id: `svc_${services.length + 1}`, isActive: true, ...data };
        services.push(item);
        return item;
      }),
      findMany: jest.fn(() => services.filter((service) => service.isActive)),
      update: jest.fn(({ where, data }: { where: { id: string }; data: { isActive?: boolean } }) => {
        const current = services.find((service) => service.id === where.id);
        if (!current) {
          throw new Error('Service not found');
        }
        Object.assign(current, data);
        return current;
      }),
    },
    schedule: {
      create: jest.fn(({ data }: { data: { weekDay: number; startTime: string; endTime: string } }) => {
        const item = { id: `sch_${schedules.length + 1}`, ...data };
        schedules.push(item);
        return item;
      }),
      findMany: jest.fn(() => schedules),
    },
    formSetting: {
      create: jest.fn(({ data }: { data: { fields: unknown } }) => {
        const item = { id: `frm_${formSettings.length + 1}`, ...data };
        formSettings.push(item);
        return item;
      }),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/services deve criar servico', async () => {
    await request(app.getHttpServer())
      .post('/api/services')
      .send({ name: 'Limpeza', durationMinutes: 30 })
      .expect(201);
  });

  it('GET /api/services deve listar servicos ativos', async () => {
    await request(app.getHttpServer()).get('/api/services').expect(200);
  });

  it('PUT /api/services/:id deve atualizar/inativar', async () => {
    await request(app.getHttpServer()).put('/api/services/svc_1').send({ isActive: false }).expect(200);
  });

  it('POST /api/schedules deve cadastrar horario', async () => {
    await request(app.getHttpServer())
      .post('/api/schedules')
      .send({ weekDay: 1, startTime: '08:00', endTime: '17:00' })
      .expect(201);
  });

  it('GET /api/schedules deve listar horarios', async () => {
    await request(app.getHttpServer()).get('/api/schedules').expect(200);
  });

  it('POST /api/form-settings deve salvar configuracao', async () => {
    await request(app.getHttpServer())
      .post('/api/form-settings')
      .send({ fields: [{ key: 'alergia', label: 'Possui alergia?', type: 'boolean' }] })
      .expect(201);
  });
});
