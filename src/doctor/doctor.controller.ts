import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UnsupportedMediaTypeException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
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

    @Get('my-details')
    async getMyDetails_Doctor(@GetUser('id') doctorId: string){
        return this.doctorService.getMyDetails_Doctor(doctorId);
    }

    @Get('get-appointments')
    async getAppointments(@GetUser('id') userId: string) {
        return this.doctorService.getAppointments(userId);
    }

    @Get('get-patientPrescriptions/:id')
    async getPatientPrescriptionById(@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientPrescriptionById(patientId);
    }

    @Get('get-patientReports/:id')
    async getPatientReportsById(@Param('id') patientId: string, @Query('search') search: string) {
        return this.doctorService.getPatientReportsById(patientId, search);
    }

    @Get('get-patientMedications/:id')
    async getPatientMedicationsById(@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientMedicationsById(patientId);
    }

    @Post('addPrecriptions/:id')
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
    @Post('delete-prescription-request/:id')
    async deletePrescriptionRequest(@GetUser('id') userId: string, @Param('id', ParseUUIDPipe) prescriptionId: string) {
        return this.doctorService.deletePrescriptionRequest(userId, prescriptionId);
    }

    @Patch('diverge-appointments')
    async divergeAppointments(@GetUser('id') doctorId: string, @Body() body: {oldDoctorId: string, newDoctorId: string , appointmentId: string}){
        const { oldDoctorId, newDoctorId, appointmentId } = body;
        return this.doctorService.divergeAppointments(doctorId, oldDoctorId, newDoctorId, appointmentId);
    }

    @Patch('diverge-appointment/:id')
    async divergeAppointment(@GetUser('id') doctorId: string, @Body() body: {appointmentId: string, oldDoctorId: string}){
        const { appointmentId, oldDoctorId } = body;
        return this.doctorService.divergeAppointment(doctorId, oldDoctorId ,appointmentId);
    }

    @Patch('update-appointment-timings')
    async updateAppointmentTimings(@GetUser('id') doctorId: string, @Body() body: {startTime: string, endTime: string}){
        return this.doctorService.updateAppointmentTimings(doctorId, body);
    }

    @Patch('set-doctor-availableForConsult')
    async setHospitalAvailability(@GetUser('id') hospitalId: string){
        return this.doctorService.setDoctorAvailability(hospitalId, true);
    }

    @Patch('set-doctor-unavailableForConsult')
    async setHospitalUnavailability(@GetUser('id') hospitalId: string){
        return this.doctorService.setDoctorAvailability(hospitalId, false);
    }

}
