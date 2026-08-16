import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

const mockApiKeys = { validate: jest.fn() };

function ctx(headers: Record<string, string>) {
  const req: any = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as any;
}

function makeGuard() {
  return new ApiKeyGuard(mockApiKeys as any);
}

describe('ApiKeyGuard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejeita quando falta X-Api-Key', async () => {
    await expect(makeGuard().canActivate(ctx({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita chave inválida', async () => {
    mockApiKeys.validate.mockResolvedValue(null);
    await expect(makeGuard().canActivate(ctx({ 'x-api-key': 'sk_x' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita chave válida e injeta tenantId no request', async () => {
    mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: [], tenant: { isActive: true } });
    const c = ctx({ 'x-api-key': 'sk_ok' });
    const ok = await makeGuard().canActivate(c);
    expect(ok).toBe(true);
    expect(c._req.tenantId).toBe('t1');
  });

  it('bloqueia Origin fora de allowedOrigins', async () => {
    mockApiKeys.validate.mockResolvedValue({
      tenantId: 't1',
      allowedOrigins: ['https://herlania.com'],
      tenant: { isActive: true },
    });
    await expect(
      makeGuard().canActivate(ctx({ 'x-api-key': 'sk_ok', origin: 'https://evil.com' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita chave de Compania desativada', async () => {
    mockApiKeys.validate.mockResolvedValue({ tenantId: 't1', allowedOrigins: [], tenant: { isActive: false } });
    await expect(
      makeGuard().canActivate(ctx({ 'x-api-key': 'sk_ok' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
