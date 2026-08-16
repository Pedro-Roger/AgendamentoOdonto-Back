import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../common/auth/roles.guard';
import { AdminTenantsController } from './admin-tenants.controller';

/**
 * `/api/admin/tenants*` só pode ser acessado por SUPERADMIN — nunca por MASTER/ADMIN/DENTISTA/
 * RECEPCIONISTA, mesmo sendo o dono de uma Compania (critério de aceite do Slice 1).
 */
function mockContext(role: string) {
  return {
    getHandler: () => AdminTenantsController.prototype.list,
    getClass: () => AdminTenantsController,
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  } as any;
}

describe('AdminTenantsController — restrito a SUPERADMIN', () => {
  let guard: RolesGuard;
  const origEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    guard = new RolesGuard(new Reflector());
  });

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
  });

  it.each(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'])('bloqueia %s com 403', (role) => {
    expect(() => guard.canActivate(mockContext(role))).toThrow(ForbiddenException);
  });

  it('permite SUPERADMIN', () => {
    expect(guard.canActivate(mockContext('SUPERADMIN'))).toBe(true);
  });
});

describe('AdminTenantsController — delegação', () => {
  const mockService = {
    listWithCounts: jest.fn(),
    getByIdWithCounts: jest.fn(),
    create: jest.fn(),
    setActive: jest.fn(),
  };
  function makeController() {
    return new AdminTenantsController(mockService as any);
  }

  beforeEach(() => jest.clearAllMocks());

  it('list delega ao service', async () => {
    mockService.listWithCounts.mockResolvedValue([]);
    await makeController().list();
    expect(mockService.listWithCounts).toHaveBeenCalled();
  });

  it('getOne delega id ao service', async () => {
    await makeController().getOne('t1');
    expect(mockService.getByIdWithCounts).toHaveBeenCalledWith('t1');
  });

  it('create delega body ao service', async () => {
    const dto = { name: 'X', slug: 'x' };
    await makeController().create(dto as any);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('setActive delega id + isActive ao service', async () => {
    await makeController().setActive('t1', { isActive: false });
    expect(mockService.setActive).toHaveBeenCalledWith('t1', false);
  });
});
