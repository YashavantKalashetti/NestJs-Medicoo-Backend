import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStratergy } from './JwtStrategy';
import { CloudinaryService } from 'src/Services';

@Module({
  imports:[JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStratergy, CloudinaryService]
})
export class AuthModule {}
