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
      create: jest.fn(({ data }: { data: { appointmentId: string; content: unknown; version: number } }) => ({ id: 'mr_1', ...data })),
      findUnique: jest.fn(() => ({ id: 'mr_1', appointmentId: 'apt_1', content: { queixa: 'dor' }, version: 1 })),
    },
    medicalRecordAttachment: {
      create: jest.fn(({ data }: { data: { medicalRecordId: string; fileUrl: string; category: string } }) => ({ id: 'att_1', ...data })),
    },
  };

  const s3Mock = {
    uploadFile: jest.fn(() => 'https://s3.local/raio-x.png'),
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

  it('POST /api/medical-records cria prontuario', async () => {
    await request(app.getHttpServer()).post('/api/medical-records').send({ appointmentId: 'apt_1', content: {} }).expect(201);
  });

  it('POST /api/medical-records/:id/duplicate duplica prontuario', async () => {
    await request(app.getHttpServer()).post('/api/medical-records/mr_1/duplicate').expect(201);
  });

  it('GET /api/medical-records/:id retorna prontuario', async () => {
    await request(app.getHttpServer()).get('/api/medical-records/mr_1').expect(200);
  });

  it('POST /api/medical-records/:id/attachments recebe multipart', async () => {
    await request(app.getHttpServer())
      .post('/api/medical-records/mr_1/attachments')
      .attach('file', Buffer.from('fake-img'), 'raio-x.png')
      .expect(201);
  });
});
