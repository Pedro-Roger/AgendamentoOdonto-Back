import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type WhatsAppConfigDto = {
  instanceId: string;
  token: string;
  clinicName: string;
  clinicAddress: string;
  isActive: boolean;
};

@Injectable()
export class WhatsAppConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.whatsAppConfig.findFirst({ where: { isActive: true } });
  }

  findFirst() {
    return this.prisma.whatsAppConfig.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  async upsert(data: WhatsAppConfigDto) {
    const existing = await this.findFirst();
    if (existing) {
      return this.prisma.whatsAppConfig.update({ where: { id: existing.id }, data });
    }
    const { randomBytes } = await import('crypto');
    return this.prisma.whatsAppConfig.create({
      data: { id: randomBytes(12).toString('hex'), ...data },
    });
  }
}
