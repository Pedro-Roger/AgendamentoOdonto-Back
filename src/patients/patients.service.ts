import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    if (!q) {
      return this.prisma.patient.findMany();
    }

    return this.prisma.patient.findMany({
      where: {
        OR: [{ name: { contains: q } }, { cpf: { contains: q } }],
      },
    });
  }

  profile(id: string) {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  async timeline(id: string) {
    const appointments = await this.prisma.appointment.findMany({ where: { patientId: id } });
    const medicalRecords = await this.prisma.medicalRecord.findMany({ where: { appointment: { patientId: id } } });
    return { appointments, medicalRecords };
  }
}
