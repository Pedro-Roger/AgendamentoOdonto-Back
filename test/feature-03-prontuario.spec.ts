import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { S3Service } from '../src/shared/s3.service';

describe('Feature 03 - Prontuario Digital', () => {
  let app: INestApplication;

  const prismaMock = {
    medicalRecord: {
      create: jest.fn(({ data }: any) => ({ id: 'mr_1', patientId: data.patientId ?? 'p_1', content: data.content ?? {}, version: data.version ?? 1, updatedAt: new Date() })),
      findUnique: jest.fn(() => ({ id: 'mr_1', patientId: 'p_1', content: { queixa: 'dor' }, version: 1, updatedAt: new Date() })),
      findFirst: jest.fn(() => null),
      update: jest.fn(({ data }: any) => ({ id: 'mr_1', patientId: 'p_1', ...data, updatedAt: new Date() })),
      findMany: jest.fn(() => []),
    },
    medicalRecordAttachment: {
      create: jest.fn(({ data }: any) => ({ id: 'att_1', ...data })),
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
    getSignedUrl: jest.fn((url: string) => url),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(S3Service)
      .useValue(s3Mock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/medical-records cria ou atualiza prontuario por paciente', async () => {
    await request(app.getHttpServer())
      .post('/api/medical-records')
      .send({ patientId: 'p_1', content: {} })
      .expect(201);
  });

  it('GET /api/medical-records/:id retorna prontuario', async () => {
    await request(app.getHttpServer()).get('/api/medical-records/mr_1').expect(200);
  });

  it('GET /api/medical-records/patient/:patientId retorna prontuario do paciente', async () => {
    await request(app.getHttpServer()).get('/api/medical-records/patient/p_1').expect(200);
  });

  it('POST /api/medical-records/:id/attachments recebe multipart', async () => {
    await request(app.getHttpServer())
      .post('/api/medical-records/mr_1/attachments')
      .attach('file', Buffer.from('fake-img'), 'raio-x.png')
      .expect(201);
  });
});
