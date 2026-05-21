import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { S3Service } from '../src/shared/s3.service';

describe('Feature 04 - Assinatura', () => {
  let app: INestApplication;

  const prismaMock = {
    signatureToken: {
      create: jest.fn(() => ({ token: 'token_1', medicalRecordId: 'mr_1' })),
      findUnique: jest.fn(() => ({ token: 'token_1', medicalRecordId: 'mr_1' })),
      update: jest.fn(() => ({ token: 'token_1' })),
    },
    medicalRecordAttachment: { create: jest.fn(() => ({ id: 'att_1' })) },
  };

  const s3Mock = { uploadFile: jest.fn(() => 'https://s3.local/assinatura.png') };

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

  it('POST /api/signatures/physical', async () => {
    await request(app.getHttpServer())
      .post('/api/signatures/physical')
      .field('medicalRecordId', 'mr_1')
      .attach('file', Buffer.from('signed-paper'), 'assinatura.jpg')
      .expect(201);
  });

  it('POST /api/signatures/electronic/generate-link', async () => {
    await request(app.getHttpServer()).post('/api/signatures/electronic/generate-link').send({ medicalRecordId: 'mr_1' }).expect(201);
  });

  it('POST /api/public/signatures/electronic/:token', async () => {
    await request(app.getHttpServer())
      .post('/api/public/signatures/electronic/token_1')
      .send({ imageBase64: 'ZmFrZQ==', latitude: -23.5, longitude: -46.6 })
      .expect(201);
  });
});
