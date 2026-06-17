import { FormSetting } from '@prisma/client';
import { FormFieldDto } from '../dto/create-form-settings.dto';

export const FORM_SETTINGS_REPOSITORY = Symbol('FORM_SETTINGS_REPOSITORY');

export interface IFormSettingsRepository {
  create(fields: FormFieldDto[], tenantId: string): Promise<FormSetting>;
  findLatest(tenantId: string): Promise<FormSetting | null>;
}
