import { Body, Controller, ForbiddenException, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BootstrapMasterDto } from './dto/bootstrap-master.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const token = await this.authService.login(body.email, body.password);
    if (!token) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return token;
  }

  @Post('bootstrap-master')
  async bootstrapMaster(@Body() body: BootstrapMasterDto) {
    const expected = process.env.BOOTSTRAP_TOKEN;
    if (!expected || expected.length < 16) {
      throw new ForbiddenException('Bootstrap desabilitado');
    }
    if (body.bootstrapToken !== expected) {
      throw new ForbiddenException('Token de bootstrap inválido');
    }
    return this.authService.bootstrapMaster({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  }
}
