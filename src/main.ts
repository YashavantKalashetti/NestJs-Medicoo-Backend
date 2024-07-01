import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';
import * as CryptoJS from 'crypto-js';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './auth/customDecorator/AllExceptionFilters';
import { TrimAndFormatPipe } from './auth/customDecorator/TrimAndFormatPipe';
import * as cors from 'cors';
import { use } from 'passport';
import { config } from 'dotenv';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes( new TrimAndFormatPipe(), new ValidationPipe(({whitelist: true, transform: true})));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1')
  const configService: ConfigService = app.get(ConfigService);
  app.use(cors({
    origin: configService.get('PRODUCTION') === false ?  ['*', 'http://localhost:5173/']: [configService.get('CLIENT_URL'), configService.get('MICROSERVICE_SERVER_URL')],
    credentials: true
  }));
  // app.useGlobalFilters(new AllExceptionsFilter());
  app.use(compression());
  // app.use(csurf({cookie: true}));
  // app.use((req, res, next) => {
  //   const cstoken = CryptoJS.AES.encrypt(req.csrfToken(), configService.get('ENCRYPT_KEY')).toString();
  //   res.cookie('X-CSRF-Token', cstoken, {httpOnly: true, secure: true, sameSite: 'strict'});
  //   next();
  // });

  await app.listen(configService.get('PORT') || 3030);
}

bootstrap();
