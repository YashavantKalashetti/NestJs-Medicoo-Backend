import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PatientModule } from './patient/patient.module';
import { DoctorModule } from './doctor/doctor.module';
import { HospitalModule } from './hospital/hospital.module';
import { CommonModuleModule } from './common-module/common-module.module';
import { CpuIntensiveTasksModule } from './cpu-intensive-tasks/cpu-intensive-tasks.module';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryService } from './Services';
import { RedisProvider } from './Services/redisServer';
import { EmailService } from './Services/email.service';

@Global()
@Module({
  imports: [AuthModule, PrismaModule, PatientModule, DoctorModule, HospitalModule, CommonModuleModule, CpuIntensiveTasksModule,
    ConfigModule.forRoot({isGlobal: true}),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EventEmitterModule.forRoot({})
  ],
  controllers: [],
  providers: [AuthModule,PrismaModule,ConfigModule, CloudinaryService, RedisProvider, EmailService],
})
export class AppModule {}
