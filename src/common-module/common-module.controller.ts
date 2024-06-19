import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Redirect } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';
import { DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { GetUser, ValidateEnumPipe } from 'src/auth/customDecorator';

@Controller('common-module')
export class CommonModuleController {

    constructor(private commonModuleService: CommonModuleService,){}

    // @Post("test")
    // async test(@Body('id') identity, @Body('name') name, @Body('age') age){
    //     console.log(identity, name, age);
    // }

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

    @Get('get-doctors')
    async getDoctors(@Query('specialization', new ValidateEnumPipe(DoctorSpecialization)) specialization: DoctorSpecialization,
            @Query('page') page: number, @Query('perPage') perPage: number){
        return this.commonModuleService.getDoctors(specialization, page, perPage);
    }

    @Get('get-hospitals')
    async getHospitals(@Query('speciality', new ValidateEnumPipe(HospitalSpeciality)) speciality: HospitalSpeciality,
                @Query('page') page: number, @Query('perPage') perPage: number){
        return this.commonModuleService.getHospitals(speciality, page, perPage);
    }

    @Get('get-doctor/:id')
    async getDoctorById(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.getDoctorById(id);
    }

    @Get('get-hospital/:id')
    async getHospitalById(@Param('id', ParseUUIDPipe) id: string){
        return this.commonModuleService.getHospitalById(id);
    }

}
