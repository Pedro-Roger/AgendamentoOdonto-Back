import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

const mockUsers = { findByEmail: jest.fn(), countAll: jest.fn(), create: jest.fn() };
const mockJwt = { signAsync: jest.fn() };
const mockTenants = { create: jest.fn(), findById: jest.fn() };
function makeService() { return new AuthService(mockUsers as any, mockJwt as any, mockTenants as any); }

describe('AuthService — tenantId no token', () => {
  beforeEach(() => jest.clearAllMocks());
  it('inclui tenantId no payload do JWT', async () => {
    mockUsers.findByEmail.mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'A', role: 'ADMIN', tenantId: 't1', isActive: true,
      password: '$2a$10$abcdefghijklmnopqrstuv',
    });
    mockTenants.findById.mockResolvedValue({ id: 't1', isActive: true });
    jest.spyOn(require('bcryptjs'), 'compareSync').mockReturnValue(true);
    mockJwt.signAsync.mockResolvedValue('tok');
    await makeService().login('a@b.com', 'senha');
    expect(mockJwt.signAsync).toHaveBeenCalledWith(expect.objectContaining({ sub: 'u1', tenantId: 't1' }));
  });
  it('bootstrapMaster cria um tenant e associa o user', async () => {
    mockUsers.countAll.mockResolvedValue(0);
    mockTenants.create.mockResolvedValue({ id: 't-new' });
    mockUsers.create.mockResolvedValue({ id: 'u1', email: 'm@c.com', role: 'MASTER' });
    await makeService().bootstrapMaster({ name: 'M', email: 'm@c.com', password: 'senha123' });
    expect(mockTenants.create).toHaveBeenCalled();
    expect(mockUsers.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't-new' }));
  });
});

describe('AuthService — Tenant.isActive valendo no login', () => {
  beforeEach(() => jest.clearAllMocks());

  function mockUser(overrides = {}) {
    mockUsers.findByEmail.mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'A', role: 'MASTER', tenantId: 't1', isActive: true,
      password: '$2a$10$abcdefghijklmnopqrstuv',
      ...overrides,
    });
    jest.spyOn(require('bcryptjs'), 'compareSync').mockReturnValue(true);
  }

  it('rejeita login se a Compania do usuário estiver desativada', async () => {
    mockUser();
    mockTenants.findById.mockResolvedValue({ id: 't1', isActive: false });
    await expect(makeService().login('a@b.com', 'senha')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita login se a Compania não for encontrada (tenantId órfão)', async () => {
    mockUser();
    mockTenants.findById.mockResolvedValue(null);
    await expect(makeService().login('a@b.com', 'senha')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite login com Compania ativa', async () => {
    mockUser();
    mockTenants.findById.mockResolvedValue({ id: 't1', isActive: true });
    mockJwt.signAsync.mockResolvedValue('tok');
    const result = await makeService().login('a@b.com', 'senha');
    expect(result).toMatchObject({ accessToken: 'tok' });
  });

  it('SUPERADMIN (tenantId null) pula a checagem de Compania', async () => {
    mockUser({ role: 'SUPERADMIN', tenantId: null });
    mockJwt.signAsync.mockResolvedValue('tok');
    const result = await makeService().login('a@b.com', 'senha');
    expect(result).toMatchObject({ accessToken: 'tok' });
    expect(mockTenants.findById).not.toHaveBeenCalled();
  });
});
