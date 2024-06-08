import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Redirect } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';
import { DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { ValidateEnumPipe } from 'src/auth/customDecorator';

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

    @Post('nearby-hospitals')
    async getNearbyHospitals(@Body() body: {latitude: string, longitude:string}){

        return this.commonModuleService.getNearbyHospitals(body);
    }

    @Get('get-doctors')
    async getDoctors(@Query('speciality', new ValidateEnumPipe(DoctorSpecialization)) speciality: DoctorSpecialization){
        return this.commonModuleService.getDoctors(speciality);
    }

    @Get('get-hospitals')
    async getHospitals(@Query('speciality', new ValidateEnumPipe(HospitalSpeciality)) speciality: HospitalSpeciality){
        return this.commonModuleService.getHospitals(speciality);
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
