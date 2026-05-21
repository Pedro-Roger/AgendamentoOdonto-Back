import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  name!: string;
  email!: string;
  password!: string;
  role!: UserRole;
}
