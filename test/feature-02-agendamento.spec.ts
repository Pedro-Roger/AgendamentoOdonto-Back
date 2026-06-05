import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Feature 02 - Agendamento pelo Paciente', () => {
  let app: INestApplication;

  const patients: Array<{ id: string; cpf: string; name: string; email: string; phone: string }> = [];
  const appointments: Array<{ id: string; patientId: string; serviceId: string; date: string; time: string }> = [];

  const tx = {
    patient: {
      findUnique: jest.fn(({ where }: { where: { cpf: string } }) => patients.find((patient) => patient.cpf === where.cpf) ?? null),
      create: jest.fn(({ data }: { data: { cpf: string; name: string; email: string; phone: string } }) => {
        const patient = { id: `pat_${patients.length + 1}`, ...data };
        patients.push(patient);
        return patient;
      }),
    },
    appointment: {
      create: jest.fn(({ data }: { data: { patientId: string; serviceId: string; date: string; time: string } }) => {
        const appointment = { id: `apt_${appointments.length + 1}`, ...data };
        appointments.push(appointment);
        return appointment;
      }),
    },
  };

  const prismaMock = {
    schedule: { findMany: jest.fn(() => [{ weekDay: 3, startTime: '09:00', endTime: '10:00' }]) },
    appointment: { findMany: jest.fn(() => []) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    notification: { create: jest.fn(() => Promise.resolve({})) },
    whatsAppConfig: { findFirst: jest.fn(() => null) },
    appointmentReminder: { findUnique: jest.fn(() => null) },
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

  it('GET /api/public/available-schedules retorna horarios disponiveis', async () => {
    await request(app.getHttpServer())
      .get('/api/public/available-schedules')
      .query({ serviceId: 'svc_1', date: '2026-05-20' })
      .expect(200);
  });

  it('POST /api/public/appointments cria paciente por CPF e agenda', async () => {
    await request(app.getHttpServer())
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
