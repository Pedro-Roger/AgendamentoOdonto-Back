import { FormSetting } from '@prisma/client';
import { FormFieldDto } from '../dto/create-form-settings.dto';

export const FORM_SETTINGS_REPOSITORY = Symbol('FORM_SETTINGS_REPOSITORY');

export interface IFormSettingsRepository {
  create(fields: FormFieldDto[]): Promise<FormSetting>;
  findLatest(): Promise<FormSetting | null>;
}
