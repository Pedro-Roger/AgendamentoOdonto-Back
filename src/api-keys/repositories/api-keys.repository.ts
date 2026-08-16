import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateApiKeyData,
  IApiKeysRepository,
} from './api-keys.repository.interface';

@Injectable()
export class ApiKeysRepository implements IApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateApiKeyData) {
    return this.prisma.apiKey.create({ data });
  }

  listByTenant(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        prefix: true,
        allowedOrigins: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByHash(keyHash: string) {
    // Inclui o Tenant pra o ApiKeyGuard checar `isActive` sem uma segunda query.
    return this.prisma.apiKey.findFirst({ where: { keyHash }, include: { tenant: true } });
  }

  revoke(id: string, tenantId: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { revokedAt: new Date() },
    });
  }

  touch(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
