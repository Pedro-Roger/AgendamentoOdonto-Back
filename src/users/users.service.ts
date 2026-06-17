import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async create(data: CreateUserDto, tenantId: string) {
    if (!data.name?.trim() || !data.email?.trim() || !data.password) {
      throw new BadRequestException('Nome, email e senha são obrigatórios');
    }
    if (data.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }
    const user = await this.usersRepository.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashSync(data.password, 10),
      role: (data.role as UserRole) ?? UserRole.ADMIN,
      tenantId,
    });
    const { password: _, ...safe } = user;
    return safe;
  }

  async update(id: string, data: UpdateUserDto, currentUserId: string) {
    const target = await this.usersRepository.findById(id);
    if (!target) throw new NotFoundException('Usuário não encontrado');

    if (target.id === currentUserId && data.isActive === false) {
      throw new BadRequestException('Não é possível desativar a própria conta');
    }
    if (target.id === currentUserId && data.role && data.role !== target.role) {
      throw new BadRequestException('Não é possível alterar o próprio papel');
    }

    const patch: {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {};

    if (typeof data.name === 'string' && data.name.trim()) patch.name = data.name.trim();
    if (typeof data.email === 'string' && data.email.trim()) {
      const email = data.email.trim().toLowerCase();
      if (email !== target.email) {
        const existing = await this.usersRepository.findByEmail(email);
        if (existing) throw new ConflictException('Email já cadastrado');
        patch.email = email;
      }
    }
    if (typeof data.password === 'string' && data.password) {
      if (data.password.length < 6) {
        throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
      }
      patch.password = hashSync(data.password, 10);
    }
    if (data.role) patch.role = data.role as UserRole;
    if (typeof data.isActive === 'boolean') patch.isActive = data.isActive;

    return this.usersRepository.update(id, patch);
  }

  list() {
    return this.usersRepository.listSafe();
  }
}
