import { Injectable } from '@nestjs/common';
import { FormSetting, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FormFieldDto } from '../dto/create-form-settings.dto';
import { IFormSettingsRepository } from './form-settings.repository.interface';

@Injectable()
export class FormSettingsRepository implements IFormSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(fields: FormFieldDto[]): Promise<FormSetting> {
    return this.prisma.formSetting.create({
      data: { fields: fields as unknown as Prisma.InputJsonValue },
    });
  }

  findLatest(): Promise<FormSetting | null> {
    return this.prisma.formSetting.findFirst({ orderBy: { createdAt: 'desc' } });
  }
}
