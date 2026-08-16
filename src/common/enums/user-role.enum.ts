export enum UserRole {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  DENTISTA = 'DENTISTA',
  RECEPCIONISTA = 'RECEPCIONISTA',
  SUPERADMIN = 'SUPERADMIN',
}

/**
 * Papéis que podem ser atribuídos via API de autoatendimento (POST/PATCH /api/users), por um
 * MASTER cadastrando/editando gente da própria Compania. Exclui SUPERADMIN de propósito: esse
 * papel só pode ser provisionado por `tools/create-superadmin.js`, fora da API. Ver achado crítico
 * de revisão de 2026-08-16 (dev-backend) — qualquer MASTER conseguia se autopromover a SUPERADMIN
 * cross-tenant via `@IsEnum(UserRole)` aceitando o enum inteiro.
 */
export const ASSIGNABLE_USER_ROLES = [
  UserRole.MASTER,
  UserRole.ADMIN,
  UserRole.DENTISTA,
  UserRole.RECEPCIONISTA,
] as const;
