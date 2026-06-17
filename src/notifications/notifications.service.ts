import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { type: string; title: string; message: string; data?: any; tenantId: string }) {
    return this.prisma.notification.create({
      data: { id: crypto.randomBytes(12).toString('hex'), ...data },
    });
  }

  listUnread(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { readAt: null, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listRecent(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { id, tenantId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { readAt: null, tenantId },
      data: { readAt: new Date() },
    });
  }
}
