import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class BootstrapMasterDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(12, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Senha deve ter ao menos 1 minúscula, 1 maiúscula e 1 dígito',
  })
  password!: string;

  @IsString()
  @Length(16, 256)
  bootstrapToken!: string;
}
