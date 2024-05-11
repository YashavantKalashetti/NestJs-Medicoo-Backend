import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentStatus, Patient, Prescription } from '@prisma/client';
import { GetUser, Roles } from '../auth/customDecorator';
import { PatientService } from './patient.service';
import { CreateAppointmentDto } from '../dto/CreateDto/createAppointment.dto';
import { ROLES } from '../auth/auth.service';
import { RolesGuard } from '../auth/JwtStrategy/roleGaurd';


@Roles([ROLES.PATIENT])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('patient')
export class PatientController {

    constructor(private patientService: PatientService){}

    @Get('get-prescriptions')
    async getPrescriptions(@GetUser() user: Patient){  
        return this.patientService.getPrescriptions(user);
    }

    @Post('book-emergency-appointment')
    async bookEmergencyAppointment(@GetUser() user: Patient, @Body() appointmentDto: CreateAppointmentDto){
        console.log("bookEmergencyAppointment")
        console.log(appointmentDto)
        return this.patientService.bookAppointment(user,appointmentDto, AppointmentStatus.EMERGENCY);
    }

    @Post('book-appointment')
    async bookAppointment(@GetUser() user: Patient, @Body() appointmentDto: CreateAppointmentDto){
        console.log("bookAppointment")
        console.log(appointmentDto)
        return this.patientService.bookAppointment(user,appointmentDto);
    }

    @Get('get-appointments')
    async getAppointments(@GetUser() user: Patient){  
        return this.patientService.getAppointments(user);
    }

    @Post('appointment-review')
    async reviewAppointment(@GetUser() user: Patient, @Body() appointmentDto: CreateAppointmentDto, @Body('rating') rating: number){
        return this.patientService.reviewAppointment(user,appointmentDto, rating);
    }

    @Get('inactive-prescriptions')
    async inactivePrescription(@GetUser() user: Patient): Promise<Prescription[]>{
        return this.patientService.inactivePrescriptions(user);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('inactive-prescription/:id')
    async deletePrescription(@GetUser() user: Patient, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) id: string):Promise<string>{
        return this.patientService.deletePrescription(user, id);
    }
}
