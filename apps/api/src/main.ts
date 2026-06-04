import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { ValidationPipe } from '@nestjs/common/pipes';
import { Logger } from '@nestjs/common/services';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );

  setupSwagger(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3001;
  await app.listen(port);
  Logger.log(`API escuchando en http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger UI en http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
