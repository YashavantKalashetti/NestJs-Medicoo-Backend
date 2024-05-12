import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';

@Controller('common-module')
export class CommonModuleController {

    constructor(private commonModuleService: CommonModuleService){}

    // @Post("test")
    // async test(@Body('id') identity, @Body('name') name, @Body('age') age){
    //     console.log(identity, name, age);
    // }

    @Get('/')
    async getDetailsOfPlatform(){
        return this.commonModuleService.getDetailsOfPlatform();
    }

    @Get('get-doctors')
    async getDoctors(): Promise<any[]>{
        return this.commonModuleService.getDoctors();
    }

    @Get('get-hospitals')
    async getHospitals(){
        return this.commonModuleService.getHospitals();
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
