import { ExecutionContext } from '@nestjs/common';
import { extractCurrentUser } from './current-user.decorator';

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
