import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Redirect } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';
import { DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { GetUser, ValidateEnumPipe } from 'src/auth/customDecorator';

@Controller('search')
export class CommonModuleController {

    constructor(private commonModuleService: CommonModuleService){}

    @Get('/one')
    async test(){
        Redirect('/common-module/');
    }

    @Get('/')
    async getDetailsOfPlatform(){
        return this.commonModuleService.getDetailsOfPlatform();
    }

    @Get('nearby-hospitals')
    async getNearbyHospitals(@Query('latitude') latitude: Number, @Query('longitude') longitude: Number, @Query('speciality', new ValidateEnumPipe(HospitalSpeciality)) speciality: HospitalSpeciality){
        return this.commonModuleService.getNearbyHospitals(latitude, longitude, speciality);
    }

    @Post('emergency-consult')
    async emergencyConsult(@Body() body: {hospitalId: string, reason: string, latitude: Number, longitude: Number, patientId: string}){
        const {hospitalId, reason, latitude, longitude, patientId} = body;
        return this.commonModuleService.emergencyConsult(hospitalId, reason, latitude, longitude, patientId);
    }

    @Get('doctors')
    async getDoctors(@Query('specialization', new ValidateEnumPipe(DoctorSpecialization)) specialization: DoctorSpecialization,
            @Query('page') page: number, @Query('perPage') perPage: number){
        return this.commonModuleService.getDoctors(specialization, page, perPage);
    }

    @Get('hospitals')
    async getHospitals(@Query('speciality', new ValidateEnumPipe(HospitalSpeciality)) speciality: HospitalSpeciality,
                @Query('page') page: number, @Query('perPage') perPage: number){
        return this.commonModuleService.getHospitals(speciality, page, perPage);
    }

    @Get('doctors/:id')
    async getDoctorById(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.getDoctorById(id);
    }

    // @Get('doctors/:id/slots')
    // async getDoctorSlots(@Param('id', ParseUUIDPipe) id: string, @Body() body: {date: Date}){
    //     return this.commonModuleService.getDoctorAvailableTimeSlots(id, new Date(body.date));
    // }

    @Get('hospitals/:id')
    async getHospitalById(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.getHospitalById(id);
    }

    @Get('doctor/:id/availability')
    async isDoctorAvailableForConsultation(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.isDoctorAvailableForConsultation(id);
    }

    @Get('hospitals/:id/availability')
    async isHospitalAvailableForConsultation(@Param('id', ParseUUIDPipe) id: string){
        console.log(id);
        return this.commonModuleService.isHospitalAvailableForConsultation(id);
    }

    @Get('doctor/:id/appointments')
    async doctorAppointments(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.getDoctorAvailableTimeSlots(id);
    }

}
