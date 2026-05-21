import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Feature 05 - Historico Paciente', () => {
  let app: INestApplication;

  const prismaMock = {
    patient: { findMany: jest.fn(() => [{ id: 'pat_1', name: 'Maria', cpf: '123' }]), findUnique: jest.fn(() => ({ id: 'pat_1' })) },
    appointment: { findMany: jest.fn(() => [{ id: 'apt_1', patientId: 'pat_1' }]) },
    medicalRecord: { findMany: jest.fn(() => [{ id: 'mr_1', version: 1 }]) },
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

  it('GET /api/patients', async () => {
    await request(app.getHttpServer()).get('/api/patients').expect(200);
  });

  it('GET /api/patients/:id/profile', async () => {
    await request(app.getHttpServer()).get('/api/patients/pat_1/profile').expect(200);
  });

  it('GET /api/patients/:id/timeline', async () => {
    await request(app.getHttpServer()).get('/api/patients/pat_1/timeline').expect(200);
  });
});
