import { IsIn, IsString } from 'class-validator';
import { ASSIGNABLE_USER_ROLES, UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  password!: string;

  // IsIn(ASSIGNABLE_USER_ROLES), não IsEnum(UserRole): SUPERADMIN existe no enum mas não é
  // atribuível via API de autoatendimento (só via tools/create-superadmin.js). Checagem
  // redundante em UsersService.create — não confiar só na camada de DTO.
  @IsIn(ASSIGNABLE_USER_ROLES)
  role!: UserRole;
}
