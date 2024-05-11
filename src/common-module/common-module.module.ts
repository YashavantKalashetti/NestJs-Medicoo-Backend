import { Module } from '@nestjs/common';
import { CommonModuleController } from './common-module.controller';
import { CommonModuleService } from './common-module.service';

@Module({
  controllers: [CommonModuleController],
  providers: [CommonModuleService]
})
export class CommonModuleModule {}
