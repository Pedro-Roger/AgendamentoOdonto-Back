import { Body, Controller, Ip, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { GenerateElectronicLinkDto } from './signatures/dto/generate-electronic-link.dto';
import { SubmitElectronicSignatureDto } from './signatures/dto/submit-electronic-signature.dto';
import { UploadPhysicalSignatureDto } from './signatures/dto/upload-physical-signature.dto';
import { SignaturesService } from './signatures.service';

@Controller('api')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post('signatures/physical')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhysical(@UploadedFile() file: Express.Multer.File, @Body() body: UploadPhysicalSignatureDto) {
    return this.signaturesService.uploadPhysical(body.medicalRecordId, file);
  }

  @Post('signatures/electronic/generate-link')
  @UseGuards(JwtAuthGuard)
  generateElectronicLink(@Body() body: GenerateElectronicLinkDto) {
    return this.signaturesService.generateElectronicLink(body.medicalRecordId);
  }

  @Post('public/signatures/electronic/:token')
  submitElectronic(
    @Param('token') token: string,
    @Body() body: SubmitElectronicSignatureDto,
    @Ip() ipAddress: string,
  ) {
    return this.signaturesService.submitElectronic(token, body, ipAddress);
  }
}
