import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Hospital } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HospitalService {
    constructor(private prismaService: PrismaService) {}

    async getMyHospitalDetails(hospitalId: string){
        const hospital = await this.prismaService.hospital.findUnique({
            where:{
                id: hospitalId
            },
            include:{
                registeredDoctors:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        address:true,
                        rating:true,
                        avatar:true,
                        totalAppointments:true,
                    }
                }
            }
        });

        delete hospital.password;
        return hospital;
    }

    async getDoctors(hospitalId: string) {
        return this.prismaService.hospital.findUnique({
            where: {
                id: hospitalId
            },
            select: {
                registeredDoctors:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        address:true,
                        rating:true,
                        avatar:true,
                        totalAppointments:true,
                    }
                }
            }
        });
    }

    async addDoctorToHospital(hospitalId: string, body: {doctorId: string}) {
        const {doctorId} = body;
        const hospital = await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },data:{
                registeredDoctors:{
                    connect:{
                        id: doctorId
                    }
                }
            }
        });
        return;
    }
}
