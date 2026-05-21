export type AnamnesisFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';

export class FormFieldDto {
  key!: string;
  label!: string;
  type!: AnamnesisFieldType;
}

export class CreateFormSettingsDto {
  fields!: FormFieldDto[];
}
