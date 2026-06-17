import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.type';

export function extractCurrentUser(_data: unknown, ctx: ExecutionContext): JwtPayload | undefined {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
}

export const CurrentUser = createParamDecorator(extractCurrentUser);
