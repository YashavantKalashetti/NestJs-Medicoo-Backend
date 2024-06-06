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

    @Get('my-details')
    async getMyDetails_Patient(@GetUser('id') userId: string){
        return this.patientService.getMyDetails_Patient(userId);
    }

    @Get('get-prescriptions')
    async getPrescriptions(@GetUser('id') userId: string){  
        return this.patientService.getPrescriptions(userId);
    }

    @Get('get-prescriptionById/:id')
    async getPrescriptionById(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) prescriptionId: string){
        return this.patientService.getPrescriptionById(userId, prescriptionId);
    }

    @Get('get-currentMedications')
    async getAllCurrentMedications(@GetUser('id') userId: string){
        return this.patientService.getAllCurrentMedications(userId);
    }

    @Get('get-medicalReports')
    async getMedicalReports(@GetUser('id') userId: string){
        return this.patientService.getMedicalReports(userId);
    }

    @Post('book-emergency-appointment')
    async bookEmergencyAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto){
        return this.patientService.bookAppointment(userId,appointmentDto, AppointmentStatus.EMERGENCY);
    }

    @Post('book-appointment')
    async bookAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto){
        // const appointmentDate = new Date(appointmentDto.date);
        // appointmentDto.date = appointmentDate.toISOString();
        return this.patientService.bookAppointment(userId,appointmentDto);
    }

    @Get('get-appointments')
    async getAppointments(@GetUser('id') userId: string){  
        return this.patientService.getAppointments(userId);
    }

    @Post('appointment-review')
    async reviewAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto, @Body('rating') rating: number){
        return this.patientService.reviewAppointment(userId,appointmentDto, rating);
    }

    @Get('inactive-prescriptions')
    async inactivePrescription(@GetUser('id') userId: string): Promise<Prescription[]>{
        return this.patientService.inactivePrescriptions(userId);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('inactive-prescription/:id')
    async deletePrescription(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) id: string):Promise<string>{
        return this.patientService.deletePrescription(userId, id);
    }
}
