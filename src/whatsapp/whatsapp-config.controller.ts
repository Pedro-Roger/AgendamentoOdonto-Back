import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { WhatsAppConfigRepository } from './whatsapp-config.repository';
import { WhatsAppService } from './whatsapp.service';
import { BaileysService } from './baileys.service';
import { IsString } from 'class-validator';

class SaveWhatsAppConfigDto {
  @IsString() clinicName!: string;
  @IsString() clinicAddress!: string;
}

class TestMessageDto {
  @IsString() phone!: string;
}

@Controller('api/whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
export class WhatsAppConfigController {
  constructor(
    private readonly configRepo: WhatsAppConfigRepository,
    private readonly whatsAppService: WhatsAppService,
    private readonly baileys: BaileysService,
  ) {}

  @Get('status')
  getStatus() {
    return {
      status: this.baileys.getStatus(),
      qr: this.baileys.getQr(),
    };
  }

  @Get('config')
  getConfig() {
    return this.configRepo.findFirst();
  }

  @Post('config')
  saveConfig(@Body() body: SaveWhatsAppConfigDto) {
    return this.configRepo.upsert({
      instanceId: '',
      token: '',
      clinicName: body.clinicName,
      clinicAddress: body.clinicAddress,
      isActive: true,
    });
  }

  @Delete('session')
  async resetSession() {
    await this.baileys.disconnect();
    return { ok: true };
  }

  @Post('test')
  async testMessage(@Body() body: TestMessageDto) {
    const sent = await this.whatsAppService.sendText(
      body.phone,
      '✅ Teste de conexão da *Clínica Sorriso*. WhatsApp via Baileys funcionando! 🦷',
    );
    return { sent };
  }
}
