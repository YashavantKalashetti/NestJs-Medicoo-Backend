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
import { EmailService } from './Services/email.service';
import { RedisModule } from './redis/redis.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  imports: [AuthModule, PrismaModule, PatientModule, DoctorModule, HospitalModule, CommonModuleModule, CpuIntensiveTasksModule,RedisModule,
    ConfigModule.forRoot({isGlobal: true}),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EventEmitterModule.forRoot({}),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000 * 1,
        limit: 3,
      },{
        name: 'medium',
        ttl: 1000 * 5,
        limit: 10
      },{
        name: 'long',
        ttl: 1000 * 30,
        limit: 20
      }
    ]),
  ],
  controllers: [],
  providers: [AuthModule,PrismaModule,ConfigModule, CloudinaryService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
