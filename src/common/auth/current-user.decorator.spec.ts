import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { extractCurrentUser, extractCurrentTenantUser } from './current-user.decorator';

function ctxWithUser(user: any): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as any;
}

describe('extractCurrentUser', () => {
  it('retorna o user do request', () => {
    const user = { sub: 'u1', email: 'a@b.com', role: 'ADMIN', tenantId: 't1' };
    expect(extractCurrentUser(undefined, ctxWithUser(user))).toEqual(user);
  });
  it('retorna undefined quando não há user', () => {
    expect(extractCurrentUser(undefined, ctxWithUser(undefined))).toBeUndefined();
  });
});

describe('extractCurrentTenantUser', () => {
  it('retorna o user quando tenantId está presente', () => {
    const user = { sub: 'u1', email: 'a@b.com', role: 'MASTER', tenantId: 't1' };
    expect(extractCurrentTenantUser(undefined, ctxWithUser(user))).toEqual(user);
  });
  it('lança ForbiddenException quando tenantId é null (SUPERADMIN)', () => {
    const user = { sub: 'u1', email: 'super@zarko.com', role: 'SUPERADMIN', tenantId: null };
    expect(() => extractCurrentTenantUser(undefined, ctxWithUser(user))).toThrow(ForbiddenException);
  });
  it('lança ForbiddenException quando não há user', () => {
    expect(() => extractCurrentTenantUser(undefined, ctxWithUser(undefined))).toThrow(ForbiddenException);
  });
});
