import { Injectable } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { IServicesRepository } from './services.repository.interface';

@Injectable()
export class ServicesRepository implements IServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  findActive(): Promise<Service[]> {
    return this.prisma.service.findMany({ where: { isActive: true } });
  }

  update(id: string, data: UpdateServiceDto): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data });
  }
}
