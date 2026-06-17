import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  API_KEYS_REPOSITORY,
  IApiKeysRepository,
} from './repositories/api-keys.repository.interface';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(API_KEYS_REPOSITORY) private readonly repo: IApiKeysRepository,
  ) {}

  async create(tenantId: string, data: { name: string; allowedOrigins: string[] }) {
    const plaintextKey = 'sk_' + crypto.randomBytes(24).toString('hex');
    const keyHash = hashKey(plaintextKey);
    const prefix = plaintextKey.slice(3, 11);
    const record = await this.repo.create({
      tenantId,
      name: data.name,
      keyHash,
      prefix,
      allowedOrigins: data.allowedOrigins ?? [],
    });
    return { ...record, plaintextKey };
  }

  list(tenantId: string) {
    return this.repo.listByTenant(tenantId);
  }

  async validate(key: string) {
    const record = await this.repo.findByHash(hashKey(key));
    if (!record || record.revokedAt) return null;
    Promise.resolve(this.repo.touch(record.id)).catch(() => {});
    return record;
  }

  revoke(id: string, tenantId: string) {
    return this.repo.revoke(id, tenantId);
  }
}
