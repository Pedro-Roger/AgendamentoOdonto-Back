import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const passwordOk = user.password.startsWith('$2') ? compareSync(password, user.password) : user.password === password;
    if (!passwordOk) return null;

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async bootstrapMaster(body: { name: string; email: string; password: string }) {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new BadRequestException('Bootstrap disabled: users already exist');
    }

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashSync(body.password, 10),
        role: 'MASTER',
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }
}
