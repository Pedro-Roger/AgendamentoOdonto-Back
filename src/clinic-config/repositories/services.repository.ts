import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { IServicesRepository } from './services.repository.interface';

@Injectable()
export class ServicesRepository implements IServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateServiceDto, tenantId: string): Promise<Service> {
    return this.prisma.service.create({ data: { ...data, tenantId } });
  }

  findActive(tenantId: string): Promise<Service[]> {
    return this.prisma.service.findMany({ where: { isActive: true, tenantId } });
  }

  async update(id: string, data: UpdateServiceDto, tenantId: string): Promise<Service> {
    const result = await this.prisma.service.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('Serviço não encontrado');
    return this.prisma.service.findFirstOrThrow({ where: { id, tenantId } });
  }
}
