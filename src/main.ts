import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security headers via helmet
  app.use(helmet());

  // CORS — require CORS_ORIGINS env var in production
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  if (!corsOrigins) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CORS_ORIGINS environment variable is required in production',
      );
    }
    logger.warn(
      'CORS_ORIGINS not set — defaulting to http://localhost:3000 (development only)',
    );
  }
  const origins = (corsOrigins || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors & Filters
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(
    `SABDA 99 POS Backend is running on: http://localhost:${port}/api/v1`,
  );
}
bootstrap();
