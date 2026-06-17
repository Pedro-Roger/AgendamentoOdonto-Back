import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../users/repositories/users.repository.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
    private readonly tenantsService: TenantsService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;

    if (!user.password || !user.password.startsWith('$2')) {
      return null;
    }
    const passwordOk = compareSync(password, user.password);
    if (!passwordOk) return null;

    if ((user as { isActive?: boolean }).isActive === false) {
      throw new BadRequestException('Conta desativada. Contate o administrador.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async bootstrapMaster(body: { name: string; email: string; password: string }) {
    const count = await this.usersRepository.countAll();
    if (count > 0) {
      throw new BadRequestException('Bootstrap disabled: users already exist');
    }

    const tenant = await this.tenantsService.create({ name: body.name, slug: body.name });

    const user = await this.usersRepository.create({
      name: body.name,
      email: body.email,
      password: hashSync(body.password, 10),
      role: UserRole.MASTER,
      tenantId: tenant.id,
    });

    return { id: user.id, email: user.email, role: user.role };
  }
}
