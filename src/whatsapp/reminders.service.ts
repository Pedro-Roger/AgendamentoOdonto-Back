import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigRepository } from './whatsapp-config.repository';
import { BaileysService } from './baileys.service';
import * as crypto from 'crypto';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsApp: WhatsAppService,
    private readonly configRepo: WhatsAppConfigRepository,
    private readonly baileys: BaileysService,
  ) {}

  @Cron('0 8 * * *', { name: 'appointment-reminders', timeZone: 'America/Sao_Paulo' })
  async sendDailyReminders() {
    if (this.baileys.getStatus() !== 'connected') {
      this.logger.log('Lembretes: WhatsApp não conectado, pulando.');
      return;
    }

    const tomorrow = this.tomorrowIso();
    const appointments = await this.prisma.appointment.findMany({
      where: { date: tomorrow, reminder: null },
      include: { patient: true, service: true },
    });

    this.logger.log(`Lembretes: ${appointments.length} consultas amanhã (${tomorrow})`);

    const baseUrl = process.env.APP_URL ?? 'https://app.sorriso.com.br';
    const configByTenant = new Map<string, { clinicName: string; clinicAddress: string }>();

    for (const appt of appointments) {
      if (!appt.patient.phone) continue;

      let config = configByTenant.get(appt.tenantId);
      if (!config) {
        const found = await this.configRepo.findFirst(appt.tenantId);
        config = {
          clinicName: found?.clinicName ?? 'Clínica',
          clinicAddress: found?.clinicAddress ?? '',
        };
        configByTenant.set(appt.tenantId, config);
      }

      const token = crypto.randomBytes(20).toString('hex');
      const message = this.whatsApp.buildReminderMessage({
        patientName: appt.patient.name,
        serviceName: appt.service.name,
        date: appt.date,
        time: appt.time,
        clinicName: config.clinicName,
        clinicAddress: config.clinicAddress,
        confirmationToken: token,
        baseUrl,
      });

      const sent = await this.whatsApp.sendText(appt.patient.phone, message);

      if (sent) {
        await this.prisma.appointmentReminder.create({
          data: {
            id: crypto.randomBytes(12).toString('hex'),
            appointmentId: appt.id,
            token,
          },
        });
        this.logger.log(`Lembrete enviado: ${appt.patient.name} (${appt.id})`);
      }
    }
  }

  async confirmAppointment(token: string): Promise<boolean> {
    const reminder = await this.prisma.appointmentReminder.findUnique({ where: { token } });
    if (!reminder || reminder.confirmedAt) return false;
    await this.prisma.appointmentReminder.update({
      where: { token },
      data: { confirmedAt: new Date() },
    });
    return true;
  }

  private tomorrowIso(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}
