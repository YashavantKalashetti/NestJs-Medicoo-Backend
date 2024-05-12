import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Hospital } from '@prisma/client';
import { RolesGuard } from 'src/auth/JwtStrategy';
import { ROLES } from 'src/auth/auth.service';
import { GetUser, Roles } from 'src/auth/customDecorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { HospitalService } from './hospital.service';

@Roles([ROLES.HOSPITAL])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('hospital')
export class HospitalController {
    constructor(private hospitalService: HospitalService) {}

    @Get('my-details')
    async getMyHospitalDetails(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getMyHospitalDetails(hospitalId);
    }


    @Get('/doctors')
    async getDoctors(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getDoctors(hospitalId);
    }


    async addDoctorToHospital(@GetUser('id') hospitalId: string, @Body() body: {doctorId: string}){
        return this.hospitalService.addDoctorToHospital(hospitalId, body);
    }

}
