import { Module } from '@nestjs/common';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';

@Module({
  controllers: [HospitalController],
  providers: [HospitalService]
})
export class HospitalModule {}
