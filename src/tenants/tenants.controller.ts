import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

/**
 * HOTFIX 0 (2026-08-16): rota restrita a SUPERADMIN.
 * Antes, `@Roles('MASTER')` — e desde a decisão (A) todo dentista é MASTER da própria
 * Compania, então qualquer dentista cadastrado conseguia listar/criar Companias de todos os
 * outros clientes (vazamento de dado de negócio, não clínico). Confirmado por grep em
 * `AgendamentoOdonto-front` e `Dra-Herlania-landing-page`: nenhum uso desta rota nos dois
 * repositórios de front, então restringir para SUPERADMIN é seguro e definitivo — não é um
 * estado temporário a ser revertido depois (ver
 * docs/superpowers/plans/2026-08-16-admin-cross-tenant-execucao.md, §1).
 * Hoje (Slice 0) nenhum usuário tem esse papel ainda, então a rota fica de fato inacessível
 * até o primeiro SUPERADMIN ser provisionado via `tools/create-superadmin.js`.
 */
@Controller('api/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body);
  }

  @Get()
  list() {
    return this.tenantsService.list();
  }
}
