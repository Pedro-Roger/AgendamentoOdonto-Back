"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DiscordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordService = void 0;
const common_1 = require("@nestjs/common");
const COLORS = {
    error: 0xe74c3c,
    warn: 0xf39c12,
    info: 0x2ecc71,
};
let DiscordService = DiscordService_1 = class DiscordService {
    constructor() {
        this.logger = new common_1.Logger(DiscordService_1.name);
        this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    }
    async sendAlert(payload) {
        if (!this.webhookUrl)
            return;
        const body = {
            embeds: [
                {
                    title: payload.title,
                    description: payload.description,
                    color: COLORS[payload.level],
                    fields: payload.fields ?? [],
                    footer: { text: 'Sorriso API' },
                    timestamp: new Date().toISOString(),
                },
            ],
        };
        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            this.logger.error('Falha ao enviar alerta Discord', err);
        }
    }
};
exports.DiscordService = DiscordService;
exports.DiscordService = DiscordService = DiscordService_1 = __decorate([
    (0, common_1.Injectable)()
], DiscordService);
//# sourceMappingURL=discord.service.js.map