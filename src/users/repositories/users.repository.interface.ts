import { User } from '@prisma/client';
import { UserRole } from '../../common/enums/user-role.enum';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type SafeUser = Omit<User, 'password'>;

export interface IUsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string, tenantId: string): Promise<User | null>;
  countAll(): Promise<number>;
  create(data: { name: string; email: string; password: string; role: UserRole; tenantId: string }): Promise<User>;
  update(id: string, data: { name?: string; email?: string; password?: string; role?: UserRole; isActive?: boolean }, tenantId: string): Promise<SafeUser>;
  listSafe(tenantId: string): Promise<SafeUser[]>;
}
