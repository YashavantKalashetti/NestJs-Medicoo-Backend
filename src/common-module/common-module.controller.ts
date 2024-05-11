import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CommonModuleService } from './common-module.service';

@Controller('common-module')
export class CommonModuleController {

    constructor(private commonModuleService: CommonModuleService){}

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
