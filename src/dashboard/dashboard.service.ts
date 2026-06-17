import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string, from: string, to: string) {
    const where = { tenantId, date: { gte: from, lte: to } };
    const [totalAppointments, newPatients, rows] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.appointment.findMany({
        where,
        select: { date: true, source: true, service: { select: { name: true } } },
      }),
    ]);

    const byKey = (arr: any[], key: (r: any) => string) => {
      const map = new Map<string, number>();
      for (const r of arr) map.set(key(r), (map.get(key(r)) ?? 0) + 1);
      return [...map.entries()];
    };

    return {
      totalAppointments,
      newPatients,
      revenue: 0,
      appointmentsByDay: byKey(rows, (r) => r.date).map(([date, count]) => ({ date, count })),
      appointmentsByService: byKey(rows, (r) => r.service?.name ?? '—').map(([name, count]) => ({ name, count })),
      appointmentsBySource: byKey(rows, (r) => r.source).map(([source, count]) => ({ source, count })),
      upcomingToday: 0,
    };
  }
}
