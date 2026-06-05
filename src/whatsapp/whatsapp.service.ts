import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppConfigRepository } from './whatsapp-config.repository';

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
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configRepo: WhatsAppConfigRepository) {}

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
    const config = await this.configRepo.findActive();
    if (!config) {
      this.logger.warn('WhatsApp: nenhuma configuração ativa encontrada');
      return false;
    }

    const formattedPhone = this.formatPhone(phone);
    const url = `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-text`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, message }),
      });

      if (!res.ok) {
        this.logger.error(`WhatsApp: Z-API respondeu ${res.status}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error('WhatsApp: falha ao enviar mensagem', err);
      return false;
    }
  }
}
