import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppConfigRepository } from './whatsapp-config.repository';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigController } from './whatsapp-config.controller';
import { RemindersService } from './reminders.service';
import { BaileysService } from './baileys.service';

@Module({
  controllers: [WhatsAppConfigController],
  providers: [
    PrismaService,
    WhatsAppConfigRepository,
    BaileysService,
    WhatsAppService,
    RemindersService,
  ],
  exports: [WhatsAppService, RemindersService],
})
export class WhatsAppModule {}
