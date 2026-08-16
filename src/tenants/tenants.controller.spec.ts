import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../common/auth/roles.guard';
import { TenantsController } from './tenants.controller';

/**
 * Regressão do vazamento de 2026-08-16: GET/POST /api/tenants usava @Roles('MASTER'), e desde
 * a decisão (A) todo dentista é MASTER da própria Compania — qualquer dentista conseguia listar
 * Companias de todos os outros clientes. A rota agora exige SUPERADMIN.
 *
 * Usa o Reflector real (não mockado) lendo a metadata de fato aplicada na classe do controller,
 * para garantir que o teste quebra se alguém reintroduzir @Roles('MASTER') por engano.
 */
function mockContext(role: string) {
  return {
    getHandler: () => TenantsController.prototype.list,
    getClass: () => TenantsController,
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  } as any;
}

describe('TenantsController — GET/POST /api/tenants restrito a SUPERADMIN', () => {
  let guard: RolesGuard;
  const origEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    guard = new RolesGuard(new Reflector());
  });

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
  });

  it.each(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA'])(
    'bloqueia %s (usuário comum, incl. dentista dono de Compania) com 403',
    (role) => {
      expect(() => guard.canActivate(mockContext(role))).toThrow(ForbiddenException);
    },
  );

  it('permite SUPERADMIN', () => {
    expect(guard.canActivate(mockContext('SUPERADMIN'))).toBe(true);
  });
});
