import { UserRole } from '../../common/enums/user-role.enum';

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}
