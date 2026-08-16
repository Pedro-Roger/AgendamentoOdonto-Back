import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto, @CurrentTenantUser() user: TenantJwtPayload) {
    return this.usersService.create(body, user.tenantId);
  }

  @Get()
  list(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.usersService.list(user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentTenantUser() user: TenantJwtPayload,
  ) {
    return this.usersService.update(id, body, user.sub, user.tenantId);
  }
}
