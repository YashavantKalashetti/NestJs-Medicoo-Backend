import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/JwtStrategy';
import { ROLES } from 'src/auth/auth.service';
import { GetUser, Roles, ValidateEnumPipe } from 'src/auth/customDecorator';
import { HospitalService } from './hospital.service';
import { CreateAppointmentDto } from 'src/dto';
import { DoctorSpecialization } from '@prisma/client';

@Roles([ROLES.HOSPITAL])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('hospital')
export class HospitalController {
    constructor(private hospitalService: HospitalService) {}

    @Get('my-details')
    async getMyHospitalDetails(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getMyHospitalDetails(hospitalId);
    }

    @Get('appointments')
    async getHospitalAppointments(@GetUser('id') hospitalId: string){
        return this.hospitalService.getHospitalAppointments(hospitalId);
    }

    @Get('emergency-appointments')
    async getEmergencyAppointments(@GetUser('id') hospitalId: string){
        return this.hospitalService.getEmergencyAppointments(hospitalId);
    }

    // Doctor routes
    
    @Get('/doctors')
    async getDoctors(@GetUser('id') hospitalId: string ){
        return this.hospitalService.getDoctors(hospitalId);
    }

    @Get('doctors/:doctorId')
    async getDoctor(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.getDoctor(hospitalId, doctorId);
    }

    @Patch('register-doctor')
    async registerDoctorToHospital(@GetUser('id') hospitalId: string, @Body('doctorId') doctorId: string){
        return this.hospitalService.registerDoctorToHospital(hospitalId, doctorId);
    }

    @Patch('remove-doctor')
    async removeDoctorFromHospital(@GetUser('id') hospitalId: string, @Body('doctorId') doctorId: string){
        return this.hospitalService.removeDoctorFromHospital(hospitalId, doctorId);
    }

    @Patch('set-doctor-AvailableInHospital/:doctorId')
    async setDoctorAvailableInHospital(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.setDoctorAvailableInHospital(hospitalId, doctorId);
    }

    @Patch('set-doctor-unAvailableInHospital/:doctorId')
    async setDoctorUnAvailableInHospital(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.setDoctorUnAvailableInHospital(hospitalId, doctorId);
    }

    @Get('doctor-appointment/:doctorId')
    async getDoctorAppointments(@GetUser('id') hospitalId: string, @Param('doctorId') doctorId: string){
        return this.hospitalService.getDoctorAppointments(hospitalId, doctorId);
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

    @Get('patients/:patientId')
    async getPatient(@GetUser('id') hospitalId: string, @Param('patientId') patientId: string){
        return this.hospitalService.getPatient(hospitalId, patientId);
    }

    @Get('patient-appointments/:patientId')
    async getPatientAppointments(@GetUser('id') hospitalId: string, @Param('patientId') patientId: string){
        return this.hospitalService.getPatientAppointmentsInHospital(hospitalId, patientId);
    }

    @Post('book-appointment')
    async bookAppointment(@GetUser('id') hospitalId: string, @Body() appointmentDto: CreateAppointmentDto){
        return this.hospitalService.bookAppointment(hospitalId, appointmentDto);
    }

    @Post('register-patient-to-hospital')
    async registerPatientToHospital(@GetUser('id') hospitalId: string, @Body('patientId') patientId: string){
        return this.hospitalService.registerPatientToHospital(hospitalId, patientId);
    }


    // Emergency routes
    @Get('getDoctorsForEmergency')
    async getDoctorsForEmergency(@GetUser('id') hospitalId: string, @Query('specialization', new ValidateEnumPipe(DoctorSpecialization)) specialization: DoctorSpecialization){
        return this.hospitalService.getDoctorsForEmergency(hospitalId, specialization);
    }

    @Get('underTake-patientEmergencyAppointment/:id')
    async underTakePatientEmergencyAppointment(@GetUser('id') hospitalId: string, @Param('id') patientId: string){
        return this.hospitalService.undertakePatientEmergencyAppointment(hospitalId, patientId);
    }

    @Patch('set-hospital-availableForConsult')
    async setHospitalAvailability(@GetUser('id') hospitalId: string){
        return this.hospitalService.setHospitalAvailability(hospitalId, true);
    }

    @Patch('set-hospital-unavailableForConsult')
    async setHospitalUnavailability(@GetUser('id') hospitalId: string){
        return this.hospitalService.setHospitalAvailability(hospitalId, false);
    }

}
