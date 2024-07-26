import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { CloudinaryService } from 'src/Services';
import { CommonModuleService } from 'src/common-module/common-module.service';
import { RealTimeUpdateService } from 'src/Helpers/RealTimeUpdate.Service';

@Module({
  controllers: [DoctorController],
  providers: [DoctorService, CloudinaryService, CommonModuleService, RealTimeUpdateService]
})
export class DoctorModule {}
