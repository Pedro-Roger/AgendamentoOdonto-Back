import { Injectable, Logger } from '@nestjs/common';

export type AlertLevel = 'error' | 'warn' | 'info';

const COLORS: Record<AlertLevel, number> = {
  error: 0xe74c3c, // vermelho
  warn:  0xf39c12, // amarelo
  info:  0x2ecc71, // verde
};

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  async sendAlert(payload: {
    level: AlertLevel;
    title: string;
    description: string;
    fields?: { name: string; value: string; inline?: boolean }[];
  }): Promise<void> {
    if (!this.webhookUrl) return;

    const body = {
      embeds: [
        {
          title: payload.title,
          description: payload.description,
          color: COLORS[payload.level],
          fields: payload.fields ?? [],
          footer: { text: 'Sorriso API' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error('Falha ao enviar alerta Discord', err);
    }
  }
}
