import { ApiKeysService } from './api-keys.service';
import * as crypto from 'crypto';

const mockRepo = {
  create: jest.fn(),
  listByTenant: jest.fn().mockResolvedValue([]),
  findByHash: jest.fn(),
  revoke: jest.fn(),
  touch: jest.fn(),
};
function makeService() {
  return new ApiKeysService(mockRepo as any);
}

describe('ApiKeysService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gera chave, guarda hash e retorna a chave em claro uma vez', async () => {
    mockRepo.create.mockResolvedValue({ id: 'k1', prefix: 'abcd1234' });
    const result = await makeService().create('t1', { name: 'Site', allowedOrigins: [] });
    // a chave em claro está no resultado
    expect(result.plaintextKey).toMatch(/^sk_/);
    // o repo recebeu um hash, não a chave em claro
    const dataArg = mockRepo.create.mock.calls[0][0];
    expect(dataArg.keyHash).toBeDefined();
    expect(dataArg.keyHash).not.toContain(result.plaintextKey);
    expect(dataArg.tenantId).toBe('t1');
  });

  it('valida uma chave correta retornando o tenant', async () => {
    const key = 'sk_teste123';
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: null, allowedOrigins: [] });
    const found = await makeService().validate(key);
    expect(mockRepo.findByHash).toHaveBeenCalledWith(hash);
    expect(found).toMatchObject({ tenantId: 't1' });
  });

  it('rejeita chave revogada', async () => {
    mockRepo.findByHash.mockResolvedValue({ id: 'k1', tenantId: 't1', revokedAt: new Date() });
    expect(await makeService().validate('sk_x')).toBeNull();
  });
});
