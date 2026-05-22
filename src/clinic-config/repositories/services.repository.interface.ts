import { Service } from '@prisma/client';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

export const SERVICES_REPOSITORY = Symbol('SERVICES_REPOSITORY');

export interface IServicesRepository {
  create(data: CreateServiceDto): Promise<Service>;
  findActive(): Promise<Service[]>;
  update(id: string, data: UpdateServiceDto): Promise<Service>;
}
