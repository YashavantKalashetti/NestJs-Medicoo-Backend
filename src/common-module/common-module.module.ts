import { Module } from '@nestjs/common';
import { CommonModuleController } from './common-module.controller';
import { CommonModuleService } from './common-module.service';
import { RedisProvider } from 'src/Services/redisServer';
import { CpuIntensiveTasksController } from 'src/cpu-intensive-tasks/cpu-intensive-tasks.controller';
import { CpuIntensiveTasksProcessor } from 'src/cpu-intensive-tasks/cpu-intensive-tasks.processor';
import { CpuIntensiveTasksModule } from 'src/cpu-intensive-tasks/cpu-intensive-tasks.module';

@Module({
  imports:[CpuIntensiveTasksModule],
  controllers: [CommonModuleController],
  providers: [CommonModuleService, RedisProvider]
})
export class CommonModuleModule {}
