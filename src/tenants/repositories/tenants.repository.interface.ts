import { Tenant } from '@prisma/client';

export const TENANTS_REPOSITORY = Symbol('TENANTS_REPOSITORY');

export type TenantWithCounts = Tenant & {
  usersCount: number;
  patientsCount: number;
  appointmentsCount: number;
};

export interface ITenantsRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
  create(data: { name: string; slug: string }): Promise<Tenant>;
  list(): Promise<Tenant[]>;
  /** Todas as Companias com contagens agregadas — usado pela administração cross-tenant. */
  listWithCounts(): Promise<TenantWithCounts[]>;
  /** Uma Compania com contagens agregadas, ou null se não existir. */
  findByIdWithCounts(id: string): Promise<TenantWithCounts | null>;
  updateActive(id: string, isActive: boolean): Promise<Tenant>;
}
