// redis.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisProvider } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}
