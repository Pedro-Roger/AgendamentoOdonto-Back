import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import 'dotenv/config';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { DiscordService } from './common/discord/discord.service';

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

  const app = await NestFactory.create(AppModule);

  const rawOrigins =
    process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
  if (rawOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN cannot be wildcard when credentials are enabled');
  }
  const corsOrigin = rawOrigins.length > 0 ? rawOrigins : ['http://localhost:3001'];

  app.enableCors({ origin: corsOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const discord = app.get(DiscordService);
  app.useGlobalFilters(new AllExceptionsFilter(discord));

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
