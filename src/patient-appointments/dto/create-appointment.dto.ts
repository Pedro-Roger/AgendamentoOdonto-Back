import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

export class AnamnesisAnswerDto {
  @IsString()
  @Length(1, 100)
  key!: string;

  @IsString()
  @Length(0, 5000)
  value!: string;
}

export class CreateAppointmentDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos' })
  cpf!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\d{10,11}$/, { message: 'Telefone inválido' })
  phone!: string;

  @IsString()
  @Length(1, 50)
  serviceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato YYYY-MM-DD' })
  date!: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora deve estar no formato HH:mm' })
  time!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnamnesisAnswerDto)
  anamnesisAnswers!: AnamnesisAnswerDto[];
}
