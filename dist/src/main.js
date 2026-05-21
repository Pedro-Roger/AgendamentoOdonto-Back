"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
require("dotenv/config");
const all_exceptions_filter_1 = require("./common/http/all-exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) ?? ['http://localhost:3000'];
    app.enableCors({ origin: corsOrigin, credentials: true });
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
//# sourceMappingURL=main.js.map