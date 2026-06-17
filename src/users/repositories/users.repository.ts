import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { IUsersRepository, SafeUser } from './users.repository.interface';

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, tenantId } });
  }

  countAll(): Promise<number> {
    return this.prisma.user.count();
  }

  create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    tenantId: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; email?: string; password?: string; role?: UserRole; isActive?: boolean },
    tenantId: string,
  ): Promise<SafeUser> {
    const { count } = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data,
    });
    if (count === 0) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.user.findFirst({
      where: { id, tenantId },
      select: SAFE_SELECT,
    }) as Promise<SafeUser>;
  }

  listSafe(tenantId: string): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: SAFE_SELECT,
    }) as Promise<SafeUser[]>;
  }
}
