import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.notificationsService.listRecent(user.tenantId);
  }

  @Get('unread')
  unread(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.notificationsService.listUnread(user.tenantId);
  }

  @Patch(':id/read')
  markRead(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.tenantId);
  }

  @Patch('read-all')
  markAllRead(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.notificationsService.markAllAsRead(user.tenantId);
  }
}
