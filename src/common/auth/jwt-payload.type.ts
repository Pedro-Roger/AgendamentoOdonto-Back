export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  /**
   * `null` só para o papel SUPERADMIN (administração cross-tenant da Zarko, sem Compania
   * própria). Todo outro papel (MASTER/ADMIN/DENTISTA/RECEPCIONISTA) sempre tem tenantId.
   * Use `TenantJwtPayload` + `@CurrentTenantUser()` em qualquer rota que exija Compania —
   * não faça `as string` neste campo.
   */
  tenantId: string | null;
};

/** JwtPayload com tenantId garantido presente — ver `@CurrentTenantUser()`. */
export type TenantJwtPayload = JwtPayload & { tenantId: string };
