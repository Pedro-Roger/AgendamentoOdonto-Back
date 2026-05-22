import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(720)
  durationMinutes!: number;
}
