import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { CloudinaryService } from 'src/Services';

@Module({
  controllers: [DoctorController],
  providers: [DoctorService, CloudinaryService]
})
export class DoctorModule {}
