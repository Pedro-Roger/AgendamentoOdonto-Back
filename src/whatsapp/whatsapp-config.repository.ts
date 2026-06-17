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

  findActive(tenantId: string) {
    return this.prisma.whatsAppConfig.findFirst({ where: { isActive: true, tenantId } });
  }

  findFirst(tenantId: string) {
    return this.prisma.whatsAppConfig.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(data: WhatsAppConfigDto, tenantId: string) {
    const existing = await this.findFirst(tenantId);
    if (existing) {
      return this.prisma.whatsAppConfig.update({ where: { id: existing.id }, data });
    }
    const { randomBytes } = await import('crypto');
    return this.prisma.whatsAppConfig.create({
      data: { id: randomBytes(12).toString('hex'), ...data, tenantId },
    });
  }
}
