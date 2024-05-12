import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from '../auth/customDecorator';
import { ROLES } from '../auth/auth.service';
import { RolesGuard } from '../auth/JwtStrategy';
import { Doctor } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
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

    @Get('get-patientMedications/:id')
    async getPatientMedicationsById(@Param('id', ParseUUIDPipe) patientId: string) {
        return this.doctorService.getPatientMedicationsById(patientId);
    }

    @Post('addPrecriptions/:id')
    @UseInterceptors(FileInterceptor('attachment', multerOptions))
    async addPrescriptions(@UploadedFile() file: Express.Multer.File, @GetUser('id') userId: string, @Param('id', ParseUUIDPipe) patientId: string, @Body() prescriptionDto: CreatePrescriptionDto){
        const filePath = file?.path;
        if(filePath){
            const uploadResponse = await this.cloudinaryService.uploadImage(filePath);
            prescriptionDto.attachment = uploadResponse.url;
        }
        return this.doctorService.addPrescriptions(userId, patientId, prescriptionDto);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('delete-prescription-request/:id')
    async deletePrescriptionRequest(@GetUser('id') userId: string, @Param('id', ParseUUIDPipe) prescriptionId: string) {
        return this.doctorService.deletePrescriptionRequest(userId, prescriptionId);
    }

}
