import { Injectable } from '@nestjs/common';
import { BaileysService } from './baileys.service';

type ReminderParams = {
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  clinicName: string;
  clinicAddress: string;
  confirmationToken: string;
  baseUrl: string;
};

@Injectable()
export class WhatsAppService {
  constructor(private readonly baileys: BaileysService) {}

  formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) return digits;
    return `55${digits}`;
  }

  buildReminderMessage(params: ReminderParams): string {
    const confirmUrl = `${params.baseUrl}/confirmar-consulta/${params.confirmationToken}`;
    return [
      `Olá, *${params.patientName}*! 👋`,
      '',
      `Lembramos que você tem uma consulta *amanhã* na *${params.clinicName}*:`,
      '',
      `📋 *Serviço:* ${params.serviceName}`,
      `📅 *Data:* ${params.date}`,
      `🕐 *Horário:* ${params.time}`,
      `📍 *Local:* ${params.clinicAddress}`,
      '',
      `Para confirmar sua presença, responda *SIM* ou acesse:`,
      confirmUrl,
      '',
      `_Caso não possa comparecer, responda NÃO._`,
      `_Clínica ${params.clinicName}_ 🦷`,
    ].join('\n');
  }

  async sendText(phone: string, message: string): Promise<boolean> {
    return this.baileys.sendText(phone, message);
  }
}
