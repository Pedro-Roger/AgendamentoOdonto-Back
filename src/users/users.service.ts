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
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(data: CreateUserDto, tenantId: string) {
    if (!data.name?.trim() || !data.email?.trim() || !data.password) {
      throw new BadRequestException('Nome, email e senha são obrigatórios');
    }
    if (data.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }
    // Defesa em profundidade: o DTO já rejeita SUPERADMIN via @IsIn(ASSIGNABLE_USER_ROLES), mas
    // não confiamos só na camada de validação. SUPERADMIN só é provisionado por
    // tools/create-superadmin.js — nunca pela API de autoatendimento do MASTER (achado crítico de
    // revisão 2026-08-16: qualquer MASTER conseguia se autopromover a superadmin cross-tenant).
    if (data.role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'SUPERADMIN não pode ser criado via API — use tools/create-superadmin.js',
      );
    }
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }
    const role = (data.role as UserRole) ?? UserRole.ADMIN;

    // Cada dentista é uma clínica própria: não herda a Compania de quem criou, ganha a sua.
    // Sem isso, todos os dentistas caem no tenant do MASTER e enxergam a mesma agenda.
    // Os demais papéis (ADMIN, RECEPCIONISTA, MASTER) continuam sendo equipe da Compania do criador.
    //
    // Ele entra na Compania nova como MASTER, e não como DENTISTA, porque é o dono do próprio
    // consultório: MASTER é o único papel que o UsersController aceita, então sem isso o dentista
    // não conseguiria cadastrar a recepcionista dele. Não perde acesso a nada — todo `@Roles` que
    // lista DENTISTA também lista MASTER, no back e na sidebar do painel.
    let effectiveTenantId = tenantId;
    let effectiveRole = role;
    if (role === UserRole.DENTISTA) {
      const tenant = await this.tenantsService.createForDentist(data.name);
      effectiveTenantId = tenant.id;
      effectiveRole = UserRole.MASTER;
    }

    const user = await this.usersRepository.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashSync(data.password, 10),
      role: effectiveRole,
      tenantId: effectiveTenantId,
    });
    const { password: _, ...safe } = user;
    return safe;
  }

  async update(id: string, data: UpdateUserDto, currentUserId: string, tenantId: string) {
    const target = await this.usersRepository.findById(id, tenantId);
    if (!target) throw new NotFoundException('Usuário não encontrado');

    if (target.id === currentUserId && data.isActive === false) {
      throw new BadRequestException('Não é possível desativar a própria conta');
    }
    if (target.id === currentUserId && data.role && data.role !== target.role) {
      throw new BadRequestException('Não é possível alterar o próprio papel');
    }
    // Defesa em profundidade (mesmo motivo do create): SUPERADMIN nunca é atribuível via API,
    // nem para criar nem para promover usuário existente.
    if (data.role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'SUPERADMIN não pode ser atribuído via API — use tools/create-superadmin.js',
      );
    }
    // Promover alguém a DENTISTA aqui recriaria o vazamento: o usuário continuaria na Compania
    // do criador. Mover de Compania órfãria os dados dele, então exigimos criar usuário novo.
    if (data.role === UserRole.DENTISTA && target.role !== UserRole.DENTISTA) {
      throw new BadRequestException(
        'Dentista precisa de Compania própria — cadastre um novo usuário com papel DENTISTA em vez de promover um existente',
      );
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

    return this.usersRepository.update(id, patch, tenantId);
  }

  list(tenantId: string) {
    return this.usersRepository.listSafe(tenantId);
  }
}
