import { Inject, Injectable } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './repositories/users.repository.interface';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
  ) {}

  create(data: CreateUserDto) {
    return this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: hashSync(data.password, 10),
      role: (data.role as UserRole) ?? UserRole.ADMIN,
    });
  }

  list() {
    return this.usersRepository.listSafe();
  }
}
