"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
require("dotenv/config");
const all_exceptions_filter_1 = require("./common/http/all-exceptions.filter");
const discord_service_1 = require("./common/discord/discord.service");
function assertEnv() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be set and at least 32 chars');
    }
    if (process.env.JWT_SECRET === 'CHANGE_ME_SUPER_SECRET_KEY') {
        throw new Error('JWT_SECRET is the default placeholder. Rotate before running.');
    }
}
async function bootstrap() {
    assertEnv();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const rawOrigins = process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
    if (rawOrigins.includes('*')) {
        throw new Error('CORS_ORIGIN cannot be wildcard when credentials are enabled');
    }
    const corsOrigin = rawOrigins.length > 0 ? rawOrigins : ['http://localhost:3001'];
    app.enableCors({ origin: corsOrigin, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
    }));
    const discord = app.get(discord_service_1.DiscordService);
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(discord));
    await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
//# sourceMappingURL=main.js.map