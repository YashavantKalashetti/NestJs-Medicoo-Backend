import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { TrimAndFormatPipe } from './auth/customDecorator/TrimAndFormat';


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes( new TrimAndFormatPipe(), new ValidationPipe(({whitelist: true, transform: true})));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1')
  app.enableCors({
    origin: '*',
    credentials: true
  });
  const configService: ConfigService = app.get(ConfigService);
  await app.listen(configService.get('PORT'));
}
bootstrap();
