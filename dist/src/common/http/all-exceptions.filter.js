"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const discord_service_1 = require("../discord/discord.service");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor(discord) {
        this.discord = discord;
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    async catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isProd = process.env.NODE_ENV === 'production';
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let safeMessage = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            const res = exception.getResponse();
            if (typeof res === 'object' && res && 'message' in res) {
                safeMessage = res.message;
            }
            else if (typeof res === 'string') {
                safeMessage = res;
            }
        }
        if (status >= 400) {
            const errorMessage = exception instanceof Error ? exception.message : String(exception);
            const stackTrace = exception instanceof Error ? (exception.stack ?? errorMessage) : String(exception);
            const user = request.user;
            const is5xx = status >= 500;
            if (is5xx) {
                this.logger.error(`[${request.method}] ${request.url} -> ${status}`, stackTrace);
            }
            else {
                this.logger.warn(`[${request.method}] ${request.url} -> ${status}: ${errorMessage}`);
            }
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
            if (is5xx && isProd)
                safeMessage = 'Internal server error';
        }
        response.status(status).json({
            statusCode: status,
            message: safeMessage,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [discord_service_1.DiscordService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map