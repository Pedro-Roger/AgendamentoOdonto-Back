import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type AnamnesisFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';

export class FormFieldDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsEnum(['text', 'textarea', 'select', 'radio', 'checkbox'])
  type!: AnamnesisFieldType;
}

export class CreateFormSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields!: FormFieldDto[];
}
