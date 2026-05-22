import { Injectable } from '@nestjs/common';
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
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  countAll(): Promise<number> {
    return this.prisma.user.count();
  }

  create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(
    id: string,
    data: { name?: string; email?: string; password?: string; role?: UserRole; isActive?: boolean },
  ): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    }) as Promise<SafeUser>;
  }

  listSafe(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: SAFE_SELECT,
    }) as Promise<SafeUser[]>;
  }
}
