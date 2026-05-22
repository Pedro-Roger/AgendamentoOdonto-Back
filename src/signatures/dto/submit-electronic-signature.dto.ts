import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class SubmitElectronicSignatureDto {
  @IsString()
  @Length(1, 2_000_000)
  imageBase64!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}
