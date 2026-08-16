import { IsString } from 'class-validator';

/**
 * Sem nenhum decorator de class-validator, o ValidationPipe global (whitelist +
 * forbidNonWhitelisted, ver main.ts) rejeita QUALQUER corpo com `unknownValue` — class-validator
 * não reconhece a classe como tendo forma nenhuma. Bug pré-existente, nunca exercitado em
 * produção porque `POST /api/tenants` não tinha nenhum caller real (confirmado por grep nos dois
 * repositórios de front). Corrigido aqui porque `POST /api/admin/tenants` (Slice 1) reaproveita
 * esta DTO e precisa funcionar de verdade.
 */
export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;
}
