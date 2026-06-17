export const API_KEYS_REPOSITORY = Symbol('API_KEYS_REPOSITORY');

export interface CreateApiKeyData {
  tenantId: string;
  name: string;
  keyHash: string;
  prefix: string;
  allowedOrigins: string[];
}

export interface IApiKeysRepository {
  create(data: CreateApiKeyData): Promise<any>;
  listByTenant(tenantId: string): Promise<any[]>;
  findByHash(keyHash: string): Promise<any | null>;
  revoke(id: string, tenantId: string): Promise<any>;
  touch(id: string): Promise<any>;
}
