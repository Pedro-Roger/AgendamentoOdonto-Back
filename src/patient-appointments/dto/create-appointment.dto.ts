export class AnamnesisAnswerDto {
  key!: string;
  value!: string;
}

export class CreateAppointmentDto {
  name!: string;
  cpf!: string;
  email!: string;
  phone!: string;
  serviceId!: string;
  date!: string;
  time!: string;
  anamnesisAnswers!: AnamnesisAnswerDto[];
}
