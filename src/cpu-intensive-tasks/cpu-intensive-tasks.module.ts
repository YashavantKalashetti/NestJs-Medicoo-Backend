import { Module } from '@nestjs/common';
import { CpuIntensiveTasksController } from './cpu-intensive-tasks.controller';
import { BullModule } from '@nestjs/bull';
import { CpuIntensiveTasksProcessor } from './cpu-intensive-tasks.processor';
import { CpuIntensiveTasksListner } from './cpu-intensiveListner';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cpuIntensiveTasks',
    }),
  ],
  controllers: [CpuIntensiveTasksController],
  providers: [CpuIntensiveTasksProcessor, CpuIntensiveTasksListner],
})
export class CpuIntensiveTasksModule {}
