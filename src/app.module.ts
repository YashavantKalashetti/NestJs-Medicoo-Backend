import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PatientModule } from './patient/patient.module';
import { DoctorModule } from './doctor/doctor.module';
import { HospitalModule } from './hospital/hospital.module';
import { CommonModuleModule } from './common-module/common-module.module';

@Global()
@Module({
  imports: [AuthModule, PrismaModule, ConfigModule.forRoot({isGlobal: true}), PatientModule, DoctorModule, HospitalModule, CommonModuleModule],
  controllers: [],
  providers: [AuthModule,PrismaModule,ConfigModule],
})
export class AppModule {}
