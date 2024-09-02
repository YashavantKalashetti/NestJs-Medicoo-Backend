import { Module } from '@nestjs/common';
import { CpuIntensiveTasksModule } from 'src/cpu-intensive-tasks/cpu-intensive-tasks.module';
import { CommonModuleController } from './common-module.controller';
import { CommonModuleService } from './common-module.service';

@Module({
  imports:[CpuIntensiveTasksModule],
  controllers: [CommonModuleController],
  providers: [CommonModuleService],
  exports: [CommonModuleService]
})
export class CommonModuleModule {}
