import { Module } from '@nestjs/common';
import { CpuIntensiveTasksController } from './cpu-intensive-tasks.controller';
import { BullModule } from '@nestjs/bull';
import { CpuIntensiveTasksProcessor } from './cpu-intensive-tasks.processor';
import { CpuIntensiveTasksListner } from './cpu-intensiveListner';
import { RedisProvider } from 'src/Services/redisServer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cpuIntensiveTasks',
    }),
  ],
  controllers: [CpuIntensiveTasksController],
  providers: [CpuIntensiveTasksProcessor, CpuIntensiveTasksListner, RedisProvider],
  exports: [BullModule, CpuIntensiveTasksProcessor],
})
export class CpuIntensiveTasksModule {}
