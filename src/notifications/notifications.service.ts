import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { type: string; title: string; message: string; data?: any }) {
    return this.prisma.notification.create({
      data: { id: crypto.randomBytes(12).toString('hex'), ...data },
    });
  }

  listUnread() {
    return this.prisma.notification.findMany({
      where: { readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listRecent() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  }
}
