import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
