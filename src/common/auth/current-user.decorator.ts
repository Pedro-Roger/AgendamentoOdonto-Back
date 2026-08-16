import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload, TenantJwtPayload } from './jwt-payload.type';

export function extractCurrentUser(_data: unknown, ctx: ExecutionContext): JwtPayload | undefined {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
}

export const CurrentUser = createParamDecorator(extractCurrentUser);

/**
 * Igual a `@CurrentUser()`, mas garante `tenantId` presente — para todo endpoint que hoje
 * presume Compania (a maioria do sistema). Só o SUPERADMIN pode ter `tenantId: null`, e nenhum
 * `@Roles(...)` existente antes do módulo `admin` inclui SUPERADMIN — então, na prática, chegar
 * aqui sem tenantId não deveria acontecer (RolesGuard já teria barrado antes). O 403 aqui é uma
 * segunda camada de defesa, não o mecanismo principal.
 */
export function extractCurrentTenantUser(_data: unknown, ctx: ExecutionContext): TenantJwtPayload {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as JwtPayload | undefined;
  if (!user?.tenantId) {
    throw new ForbiddenException('Este recurso exige um usuário vinculado a uma Compania');
  }
  return user as TenantJwtPayload;
}

export const CurrentTenantUser = createParamDecorator(extractCurrentTenantUser);
