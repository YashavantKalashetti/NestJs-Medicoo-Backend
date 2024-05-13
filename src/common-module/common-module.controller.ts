import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';
import { DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';

@Controller('common-module')
export class CommonModuleController {

    constructor(private commonModuleService: CommonModuleService,){}

    // @Post("test")
    // async test(@Body('id') identity, @Body('name') name, @Body('age') age){
    //     console.log(identity, name, age);
    // }

    @Get('/')
    async getDetailsOfPlatform(){
        return this.commonModuleService.getDetailsOfPlatform();
    }

    @Post('nearby-hospitals')
    async getNearbyHospitals(@Body() body: {latitude: string, longitude:string}){

        return this.commonModuleService.getNearbyHospitals(body);
    }

    @Get('get-doctors')
    async getDoctors(): Promise<any[]>{
        return this.commonModuleService.getDoctors();
    }

    @Get('get-hospitals')
    async getHospitals(){
        return this.commonModuleService.getHospitals();
    }

    @Get('get-doctorBySpecialization/:specialization')
    async getDoctorBySpecialization(@Param('specialization') specialization: DoctorSpecialization){
        return this.commonModuleService.getDoctorBySpecialization(specialization);
    }

    @Get('get-hospitalBySpeciality/:speciality')
    async getHospitalBySpeciality(@Param('speciality') speciality: HospitalSpeciality){
        return this.commonModuleService.getHospitalBySpeciality(speciality);
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
