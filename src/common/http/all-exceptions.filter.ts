import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DiscordService } from '../discord/discord.service';

// Mensagem que o próprio Nest lança (routes-resolver.ts) quando nenhuma rota
// bate com o método/path da request — não é uma NotFoundException de negócio.
const ROUTER_NOT_FOUND_REGEX = /^Cannot (GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) /;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly discord: DiscordService) {}

  private isRouterNotFound(exception: unknown): boolean {
    return (
      exception instanceof NotFoundException &&
      ROUTER_NOT_FOUND_REGEX.test(exception.message)
    );
  }

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

    if (status >= 400) {
      const errorMessage = exception instanceof Error ? exception.message : String(exception);
      const stackTrace = exception instanceof Error ? (exception.stack ?? errorMessage) : String(exception);
      const user = request.user;
      const is5xx = status >= 500;
      const isRouterNotFound = this.isRouterNotFound(exception);

      if (is5xx) {
        this.logger.error(
          `[${request.method}] ${request.url} -> ${status}`,
          stackTrace,
        );
      } else if (isRouterNotFound) {
        // Rota inexistente (sondagem de bot/scanner etc) — segue no log local,
        // mas não vira alerta no Discord pra não afogar o canal com ruído.
        this.logger.warn(`[${request.method}] ${request.url} -> ${status} (rota não encontrada)`);
      } else {
        this.logger.warn(`[${request.method}] ${request.url} -> ${status}: ${errorMessage}`);
      }

      // Alerta Discord — 🔴 para 5xx, 🟡 para 4xx de negócio (fire-and-forget).
      // 404 de rota inexistente (Cannot GET/POST/... do próprio Nest) não gera alerta.
      if (!isRouterNotFound) {
        const emoji = is5xx ? '🔴' : '🟡';
        const levelLabel = is5xx ? 'ERRO' : 'AVISO';
        this.discord.sendAlert({
          level: is5xx ? 'error' : 'warn',
          title: `${emoji} ${status} ${levelLabel} — ${request.method} ${request.url}`,
          description: is5xx
            ? `**Mensagem:** ${errorMessage}\n\`\`\`${stackTrace.slice(0, 1500)}\`\`\``
            : `**Mensagem:** ${errorMessage}`,
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
              name: `${emoji} Status`,
              value: `${status}`,
              inline: true,
            },
            {
              name: '💬 Mensagem',
              value: `\`${String(Array.isArray(safeMessage) ? safeMessage.join(', ') : safeMessage).slice(0, 500)}\``,
              inline: false,
            },
          ],
        }).catch(() => null);
      }

      if (is5xx && isProd) safeMessage = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
