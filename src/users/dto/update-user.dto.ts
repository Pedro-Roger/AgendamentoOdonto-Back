import { IsIn, IsOptional } from 'class-validator';
import { ASSIGNABLE_USER_ROLES, UserRole } from '../../common/enums/user-role.enum';

// ATENÇÃO: name/email/password/isActive seguem de propósito sem decorator — bug pré-existente,
// registrado em separado no diário do projeto (PATCH /api/users/:id fica sem efeito com o
// ValidationPipe global whitelist+forbidNonWhitelisted). Não é escopo desta correção; só `role`
// ganhou decorator aqui, para fechar o achado crítico de SUPERADMIN via API (ver
// user-role.enum.ts). Checagem redundante em UsersService.update — não confiar só no DTO.
export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_USER_ROLES)
  role?: UserRole;

  isActive?: boolean;
}
