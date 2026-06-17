import { Tenant } from '@prisma/client';

export const TENANTS_REPOSITORY = Symbol('TENANTS_REPOSITORY');

export interface ITenantsRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
  create(data: { name: string; slug: string }): Promise<Tenant>;
  list(): Promise<Tenant[]>;
}
