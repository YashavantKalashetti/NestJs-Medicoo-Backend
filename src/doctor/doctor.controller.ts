import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from '../auth/customDecorator';
import { ROLES } from '../auth/auth.service';
import { RolesGuard } from '../auth/JwtStrategy';
import { Doctor } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';

@Roles([ROLES.DOCTOR])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('doctor')
export class DoctorController {
    constructor(private doctorService: DoctorService,) {}

    @Get('get-appointments')
    async getAppointments(@GetUser() user: Doctor) {
        return this.doctorService.getAppointments(user);
    }

    @Get('get-prescriptions/:id')
    async viewPrescriptionById(@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.viewPrescriptionById(patientId);
    }

    @Post('addPrecriptions/:id')
    async addPrescriptions(@GetUser() user: Doctor, @Param('id', ParseUUIDPipe) patientId: string, @Body() prescriptionDto: CreatePrescriptionDto){
        return this.doctorService.addPrescriptions(user, patientId, prescriptionDto);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('delete-prescription-request/:id')
    async deletePrescriptionRequest(@GetUser() user:Doctor, @Param('id', ParseUUIDPipe) prescriptionId: string) {
        return this.doctorService.deletePrescriptionRequest(user, prescriptionId);
    }

}
