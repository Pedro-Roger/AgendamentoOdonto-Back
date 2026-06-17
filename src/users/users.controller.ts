import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtPayload } from '../common/auth/jwt-payload.type';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto, @Req() req: any) {
    return this.usersService.create(body, req.user?.tenantId);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.usersService.list(user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, body, req.user?.sub, user.tenantId);
  }
}
