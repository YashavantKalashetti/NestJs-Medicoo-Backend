import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/JwtStrategy';
import { ROLES } from 'src/auth/auth.service';
import { GetUser, Roles, ValidateEnumPipe } from 'src/auth/customDecorator';
import { HospitalService } from './hospital.service';
import { CreateAppointmentDto } from 'src/dto';
import { AppointmentStatus, DoctorSpecialization } from '@prisma/client';

@Roles([ROLES.HOSPITAL])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('hospital')
export class HospitalController {
    constructor(private hospitalService: HospitalService) {}

    @Get('')
    async getMyHospitalDetails(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getMyHospitalDetails(hospitalId);
    }

    @Get('appointments')
    async getHospitalAppointments(@GetUser('id') hospitalId: string, @Query('status', new ValidateEnumPipe(AppointmentStatus)) status: AppointmentStatus){
        return this.hospitalService.getHospitalAppointments(hospitalId, status);
    }

    @Post('appointments')
    async bookAppointment(@GetUser('id') hospitalId: string, @Body() appointmentDto: CreateAppointmentDto){
        return this.hospitalService.bookAppointment(hospitalId, appointmentDto);
    }

    @Get('emergency-appointments')
    async getEmergencyAppointments(@GetUser('id') hospitalId: string){
        return this.hospitalService.getEmergencyAppointments(hospitalId);
    }

    // Doctor routes
    
    @Get('doctors')
    async getDoctors(@GetUser('id') hospitalId: string, @Query('specialization', new ValidateEnumPipe(DoctorSpecialization)) specialization: DoctorSpecialization){
        return this.hospitalService.getDoctors(hospitalId, specialization);
    }

    @Patch('doctors')
    async registerDoctorToHospital(@GetUser('id') hospitalId: string, @Body('doctor_number') doctor_number: string){
        return this.hospitalService.registerDoctorToHospital(hospitalId, doctor_number);
    }

    @Get('doctors/:doctorId')
    async getDoctor(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.getDoctor(hospitalId, doctorId);
    }

    @Patch('doctors/:doctorId')
    async removeDoctorFromHospital(@GetUser('id') hospitalId: string, @Body('doctorId') doctorId: string){
        return this.hospitalService.removeDoctorFromHospital(hospitalId, doctorId);
    }

    @Get('doctors/:doctorId/appointments')
    async getDoctorAppointments(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.getDoctorAppointments(hospitalId, doctorId);
    }

    @Patch('doctors/:doctorId/available')
    async setDoctorAvailableInHospital(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.setDoctorAvailableInHospital(hospitalId, doctorId);
    }

    @Patch('doctors/:doctorId/unavailable')
    async setDoctorUnAvailableInHospital(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.setDoctorUnAvailableInHospital(hospitalId, doctorId);
    }

    // change the appointments of one doctor to another doctor in case of Unavailability
    @Patch('diverge-allAppointments')
    async divertAppointment(@GetUser('id') hospitalId: string, @Body() body: {oldDoctorId: string, newDoctorId: string}){
        const { oldDoctorId, newDoctorId } = body;
        return this.hospitalService.divergeAppointments(hospitalId, oldDoctorId, newDoctorId);
    }

    @Patch('diverge-sigleAppointment')
    async divertSingleAppointment(@GetUser('id') hospitalId: string, @Body() body: {oldDoctorId: string, newDoctorId: string , appointmentId: string}){
        const { oldDoctorId, newDoctorId, appointmentId } = body;
        return this.hospitalService.divergeSingleAppointment(hospitalId, oldDoctorId, newDoctorId, appointmentId);
    }

    // Patient routes
    @Get('/patients')
    async getPatients(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getPatients(hospitalId);
    }

    @Post('patients')
    async registerPatientToHospital(@GetUser('id') hospitalId: string, @Body('patient_number') patient_number: string){
        return this.hospitalService.registerPatientToHospital(hospitalId, patient_number);
    }

    @Get('patients/:patientId')
    async getPatient(@GetUser('id') hospitalId: string, @Param('patientId') patientId: string){
        return this.hospitalService.getPatient(hospitalId, patientId);
    }

    @Get('patients/:patientId/appointments')
    async getPatientAppointments(@GetUser('id') hospitalId: string, @Param('patientId') patientId: string){
        return this.hospitalService.getPatientAppointmentsInHospital(hospitalId, patientId);
    }

    // Emergency routes
    @Get('emergency-doctors')
    async getDoctorsForEmergency(@GetUser('id') hospitalId: string, @Query('specialization', new ValidateEnumPipe(DoctorSpecialization)) specialization: DoctorSpecialization){
        return this.hospitalService.getDoctorsForEmergency(hospitalId, specialization);
    }

    @Get('patientEmergencyAppointment/:patient_number')
    async underTakePatientEmergencyAppointment(@GetUser() hospital, @Param('patient_number') patient_number: string){
        return this.hospitalService.undertakePatientEmergencyAppointment(hospital, patient_number);
    }

    @Patch('setAvailability')
    async setHospitalAvailability(@GetUser('id') hospitalId: string, @Query('availability') availability: boolean){
        return this.hospitalService.setHospitalAvailability(hospitalId, availability);
    }
}
