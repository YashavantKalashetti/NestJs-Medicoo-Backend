
import { Global, Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { CommonModuleService } from 'src/common-module/common-module.service';
import { Doctor } from '@prisma/client';

@Global()
@Injectable()
export class RealTimeUpdateService {
  constructor(private readonly configService: ConfigService, private readonly commonModuleService: CommonModuleService) {}


  async setDoctorDetailsGlobally(doctor: Doctor) {
    try {

        const { availableSlotsByDate, availableForConsult } = await this.commonModuleService.getDoctorAvailableTimeSlots(doctor.id);

        const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/medData/doctors/${doctor.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                availableSlotsByDate, 
                availableForConsult
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        if(!response.ok){
            console.log("Error in updating doctor availability");
        }
    } catch (error) {
        // console.error(error);
        // throw new InternalServerErrorException('Failed to update doctor availability'); 
    }
  }

  
}

