import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisProvider implements OnModuleInit {
  private client: RedisClientType<any, any>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {

    this.client = createClient({
      password: this.configService.get<string>('REDIS_CLOUD_PASSWORD'),
      socket: {
        host: this.configService.get<string>('REDIS_CLOUD_HOST'),
        port: this.configService.get<number>('REDIS_CLOUD_PORT'),
      },
    });
    this.connect();
  }

  private async connect() {
    await this.client.connect();
  }

  getClient(): RedisClientType<any, any> {
    return this.client;
  }
}
