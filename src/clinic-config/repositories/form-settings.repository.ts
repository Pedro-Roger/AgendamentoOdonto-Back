import { Injectable } from '@nestjs/common';
import { FormSetting, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FormFieldDto } from '../dto/create-form-settings.dto';
import { IFormSettingsRepository } from './form-settings.repository.interface';

@Injectable()
export class FormSettingsRepository implements IFormSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(fields: FormFieldDto[], tenantId: string): Promise<FormSetting> {
    return this.prisma.formSetting.create({
      data: { fields: fields as unknown as Prisma.InputJsonValue, tenantId },
    });
  }

  findLatest(tenantId: string): Promise<FormSetting | null> {
    return this.prisma.formSetting.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
