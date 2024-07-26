import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { CommonModuleService } from 'src/common-module/common-module.service';
import { RealTimeUpdateService } from 'src/Helpers/RealTimeUpdate.Service';

@Module({
  controllers: [PatientController],
  providers: [PatientService, CommonModuleService, RealTimeUpdateService]
})
export class PatientModule {}
