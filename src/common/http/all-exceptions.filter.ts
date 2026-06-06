import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DiscordService } from '../discord/discord.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly discord: DiscordService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const isProd = process.env.NODE_ENV === 'production';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let safeMessage: string | string[] = 'Internal server error';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res && 'message' in (res as Record<string, unknown>)) {
        safeMessage = (res as Record<string, unknown>).message as string | string[];
      } else if (typeof res === 'string') {
        safeMessage = res;
      }
    }

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.message : String(exception);
      const user = request.user;

      this.logger.error(
        `[${request.method}] ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      // Alerta Discord (fire-and-forget)
      this.discord.sendAlert({
        level: 'error',
        title: `🚨 Erro ${status} — ${request.method} ${request.url}`,
        description: `\`\`\`${stack.slice(0, 1800)}\`\`\``,
        fields: [
          {
            name: '📍 Endpoint',
            value: `\`${request.method} ${request.url}\``,
            inline: true,
          },
          {
            name: '👤 Usuário',
            value: user
              ? `${user.name ?? '?'} (${user.email ?? user.sub ?? '?'}) — ${user.role ?? '?'}`
              : 'Não autenticado',
            inline: true,
          },
          {
            name: '🔴 Status',
            value: `${status}`,
            inline: true,
          },
          {
            name: '💬 Mensagem',
            value: Array.isArray(safeMessage) ? safeMessage.join(', ') : safeMessage,
            inline: false,
          },
        ],
      }).catch(() => null);

      if (isProd) safeMessage = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
