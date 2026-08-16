import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type UserRole = 'MASTER' | 'ADMIN' | 'DENTISTA' | 'RECEPCIONISTA' | 'SUPERADMIN';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
