import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { WhatsAppConfigRepository } from './whatsapp-config.repository';
import { WhatsAppService } from './whatsapp.service';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

class SaveWhatsAppConfigDto {
  @IsString() @MaxLength(100) instanceId!: string;
  @IsString() @MaxLength(200) token!: string;
  @IsString() @MaxLength(100) clinicName!: string;
  @IsString() @MaxLength(300) clinicAddress!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
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
  ) {}

  @Get('config')
  getConfig() {
    return this.configRepo.findFirst();
  }

  @Post('config')
  saveConfig(@Body() body: SaveWhatsAppConfigDto) {
    return this.configRepo.upsert({
      instanceId: body.instanceId,
      token: body.token,
      clinicName: body.clinicName,
      clinicAddress: body.clinicAddress,
      isActive: body.isActive ?? true,
    });
  }

  @Post('test')
  async testMessage(@Body() body: TestMessageDto) {
    const sent = await this.whatsAppService.sendText(
      body.phone,
      '✅ Teste de conexão da *Clínica Sorriso*. WhatsApp configurado com sucesso! 🦷',
    );
    return { sent };
  }
}
