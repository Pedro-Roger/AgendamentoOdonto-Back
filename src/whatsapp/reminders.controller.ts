import { Controller, Param, Post } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('api/public/confirm')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post(':token')
  async confirmAppointment(@Param('token') token: string) {
    const confirmed = await this.remindersService.confirmAppointment(token);
    return { confirmed };
  }
}
