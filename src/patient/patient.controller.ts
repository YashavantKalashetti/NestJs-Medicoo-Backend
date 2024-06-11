import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
    async getPatientReports(@GetUser('id') userId: string, @Query('search') search: string){
        return this.patientService.getPatientReports(userId, search);
    }

    // @Post('book-emergency-appointment')
    // async bookEmergencyAppointment(@GetUser('id') userId: string, @Body() appointmentDto: CreateAppointmentDto){
    //     return this.patientService.bookAppointment(userId,appointmentDto, AppointmentStatus.EMERGENCY);
    // }

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

    @Post('appointment-review/:id')
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

    @Patch('update-parentAccess')
    async updateParentAccess(@GetUser('id') userId: string, @Body() body: any){
        return this.patientService.updateParent(userId, body.parentId);
    }

    @Get('get-childrens')
    async getChild(@GetUser('id') userId: string){
        return this.patientService.getChildrens(userId);
    }

    @Get('get-childDetails/:id')
    async getChildDetails(@GetUser('id') userId: string, @Param('id', new ParseUUIDPipe({errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE})) patientId: string){
        return this.patientService.getChildDetails(userId, patientId);
    }


}
