import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
  async bootstrapMaster(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.bootstrapMaster(body);
  }
}
