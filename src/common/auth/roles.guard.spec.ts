import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function mockContext(role: string) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  const origEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
  });

  it('passes when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('RECEPCIONISTA'))).toBe(true);
  });

  it('allows MASTER on any endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA']);
    expect(guard.canActivate(mockContext('MASTER'))).toBe(true);
  });

  it('allows DENTISTA on medical-records endpoints (MASTER,ADMIN,DENTISTA)', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA']);
    expect(guard.canActivate(mockContext('DENTISTA'))).toBe(true);
  });

  it('blocks RECEPCIONISTA from medical-records', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA']);
    expect(() => guard.canActivate(mockContext('RECEPCIONISTA'))).toThrow(ForbiddenException);
  });

  it('blocks DENTISTA from financial endpoints (MASTER,ADMIN only)', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
    expect(() => guard.canActivate(mockContext('DENTISTA'))).toThrow(ForbiddenException);
  });

  it('blocks RECEPCIONISTA from financial endpoints', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
    expect(() => guard.canActivate(mockContext('RECEPCIONISTA'))).toThrow(ForbiddenException);
  });

  it('allows RECEPCIONISTA on patient list (all roles)', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA']);
    expect(guard.canActivate(mockContext('RECEPCIONISTA'))).toBe(true);
  });

  it('blocks unknown role', () => {
    reflector.getAllAndOverride.mockReturnValue(['MASTER', 'ADMIN']);
    expect(() => guard.canActivate(mockContext('UNKNOWN'))).toThrow(ForbiddenException);
  });
});
