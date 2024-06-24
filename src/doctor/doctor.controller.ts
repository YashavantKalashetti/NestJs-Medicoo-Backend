import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UnsupportedMediaTypeException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from '../auth/customDecorator';
import { ROLES } from '../auth/auth.service';
import { RolesGuard } from '../auth/JwtStrategy';
import { Doctor } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, multerOptions } from 'src/Services';

@Roles([ROLES.DOCTOR])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('doctor')
export class DoctorController {
    constructor(private doctorService: DoctorService, private cloudinaryService: CloudinaryService) {}

    @Get('')
    async getMyDetails_Doctor(@GetUser('id') doctorId: string){
        return this.doctorService.getMyDetails_Doctor(doctorId);
    }

    @Get('appointments')
    async getAppointments(@GetUser('id') userId: string) {
        return this.doctorService.getAppointments(userId);
    }

    @Get('appointments/:id')
    async getAppointmentById(@Param('id', ParseUUIDPipe) appointmentId: string) {
        return this.doctorService.getAppointmentById(appointmentId, appointmentId);
    }

    @Get('patient/:id')
    async getPatientById(@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientById(patientId);
    }

    @Post('patient/:id')
    @UseInterceptors(FilesInterceptor('attachments',10, multerOptions))
    async addPrescriptions(@UploadedFiles() files: Express.Multer.File[], @GetUser('id') userId: string, @Param('id', ParseUUIDPipe) patientId: string, @Body() prescriptionDto: CreatePrescriptionDto){
        prescriptionDto.attachments = [];
        if(files){
            await Promise.all(files?.map(async (file) => {
                try {
                    const uploadResponse = await this.cloudinaryService.uploadImage(file.path);
                    prescriptionDto.attachments.push(uploadResponse.url);
                } catch (error) {
                    throw new UnsupportedMediaTypeException("Only Images and Pdfs are allowed")
                }
            }));
        }
        return this.doctorService.addPrescriptions(userId, patientId, prescriptionDto);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('patient/:id')
    async deletePrescriptionRequest(@GetUser('id') userId: string, @Param('id', ParseUUIDPipe) prescriptionId: string) {
        return this.doctorService.deletePrescriptionRequest(userId, prescriptionId);
    }

    @Get('patient/:id/prescriptions')
    async getPatientPrescriptionById(@GetUser('id') userId: string,@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientPrescriptionById(userId, patientId);
    }

    @Get('patient/:id/reports')
    async getPatientReportsById(@Param('id') patientId: string, @Query('search') search: string) {
        return this.doctorService.getPatientReportsById(patientId, search);
    }

    @Get('patient/:id/medications')
    async getPatientMedicationsById(@GetUser('id') userId: string ,@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientMedicationsById(userId, patientId);
    }

    @Patch('diverge-appointments')
    async divergeAppointments(@GetUser('id') doctorId: string, @Body() body: {oldDoctorId: string, newDoctorId: string , appointmentId: string}){
        const { oldDoctorId, newDoctorId, appointmentId } = body;
        return this.doctorService.divergeAppointments(doctorId, oldDoctorId, newDoctorId, appointmentId);
    }

    @Patch('diverge-appointments/:id')
    async divergeAppointment(@GetUser('id') doctorId: string, @Body() body: {appointmentId: string, oldDoctorId: string}){
        const { appointmentId, oldDoctorId } = body;
        return this.doctorService.divergeAppointment(doctorId, oldDoctorId ,appointmentId);
    }

    @Patch('timings')
    async updateAppointmentTimings(@GetUser('id') doctorId: string, @Body() body: {startTime: string, endTime: string}){
        return this.doctorService.updateAppointmentTimings(doctorId, body);
    }

    @Patch('availability')
    async setHospitalAvailability(@GetUser('id') hospitalId: string, @Body() body: {availability: boolean}){
        return this.doctorService.setDoctorAvailability(hospitalId, body.availability);
    }


    @Patch('consulting-fee')
    async setAppointmentFee(@GetUser('id') doctorId: string, @Body('consultingFees') consultingFees: number){
        return this.doctorService.setAppointmentFee(doctorId, consultingFees);
    }

}
