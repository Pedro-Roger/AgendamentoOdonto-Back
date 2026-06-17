import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtPayload } from '../common/auth/jwt-payload.type';

@Controller('api/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER', 'ADMIN')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; allowedOrigins?: string[] },
  ) {
    return this.apiKeys.create(user.tenantId, {
      name: body.name,
      allowedOrigins: body.allowedOrigins ?? [],
    });
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.apiKeys.list(user.tenantId);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.apiKeys.revoke(id, user.tenantId);
  }
}
