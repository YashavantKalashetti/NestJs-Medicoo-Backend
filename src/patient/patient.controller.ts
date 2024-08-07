import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Search, UseGuards } from '@nestjs/common';
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

    @Get('')
    async getMyDetails_Patient(@GetUser('id') userId: string){
        return this.patientService.getMyDetails_Patient(userId);
    }

    @Get('prescriptions')
    async getPrescriptions(@GetUser('id') userId: string){  
        return this.patientService.getPrescriptions(userId);
    }

    @Get('prescriptions/:id')
    async getPrescriptionById(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) prescriptionId: string){
        return this.patientService.getPrescriptionById(userId, prescriptionId);
    }

    @Patch('prescriptions/:id')
    async updatePrescriptionDisplayStatus(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) prescriptionId: string, @Query('status') status: boolean){
        return this.patientService.updatePrescriptionDisplayStatus(userId, prescriptionId, status);
    }

    @Get('medications')
    async getAllCurrentMedications(@GetUser('id') userId: string){
        return this.patientService.getAllCurrentMedications(userId);
    }

    @Get('reports')
    async getPatientReports(@GetUser('id') userId: string, @Param('search', ) search: string){
        return this.patientService.getPatientReports(userId, search);
    }

    // @Post('book-emergency-appointment')
    // async bookEmergencyAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto){
    //     return this.patientService.bookAppointment(userId,appointmentDto, AppointmentStatus.EMERGENCY);
    // }

    @Get('appointments')
    async getAppointments(@GetUser('id') userId: string){  
        return this.patientService.getAppointments(userId);
    }

    @Post('appointments')
    async bookAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto){
        // const appointmentDate = new Date(appointmentDto.date);
        // appointmentDto.date = appointmentDate.toISOString();
        return this.patientService.bookAppointment(userId,appointmentDto);
    }

    @Post('appointments/:id/review')
    async reviewAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto, @Body('rating') rating: number, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) appointmentId: string){
        return this.patientService.reviewAppointment(userId,appointmentId, appointmentDto, rating);
    }

    @Get('inactive-prescriptions')
    async inactivePrescription(@GetUser('id') userId: string){
        return this.patientService.inactivePrescriptions(userId);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('inactive-prescription/:id')
    async deletePrescription(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) id: string){
        return this.patientService.deletePrescription(userId, id);
    }

    @Patch('parentAccess')
    async updateParentAccess(@GetUser('id') userId: string, @Body() body: any){
        return this.patientService.updateParent(userId, body.patient_number);
    }

    @Get('childrens')
    async getChild(@GetUser('id') userId: string){
        return this.patientService.getChildrens(userId);
    }

    @Get('childrens/:id')
    async getChildDetails(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) patientId: string){
        return this.patientService.getChildDetails(userId, patientId);
    }

    @Get('childrens/:id/appointments')
    async getChildEmergencyAppointments(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) patientId: string){
        return this.patientService.getChildEmergencyAppointments(userId, patientId);
    }

    @Patch('doctorAccess')
    async updatePrimaryDoctorAccess(@GetUser('id') userId: string, @Body() body){
        return this.patientService.updatePrimaryDoctorAccess(userId, body);
    }

}
