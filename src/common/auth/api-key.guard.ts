import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] as string | undefined;
    if (!key) throw new UnauthorizedException('Missing X-Api-Key');

    const record = await this.apiKeys.validate(key);
    if (!record) throw new UnauthorizedException('Invalid API key');

    const origin = (req.headers['origin'] || req.headers['referer']) as string | undefined;
    if (record.allowedOrigins?.length && origin) {
      const allowed = record.allowedOrigins.some((o: string) => origin.startsWith(o));
      if (!allowed) throw new UnauthorizedException('Origin not allowed');
    }

    req.tenantId = record.tenantId;
    req.apiKeyId = record.id;
    return true;
  }
}
