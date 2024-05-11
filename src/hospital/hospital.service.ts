import { Injectable } from '@nestjs/common';
import { Hospital } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HospitalService {
    constructor(private prismaService: PrismaService) {}

    async getDoctors(hospitalUser: Hospital) {
        return this.prismaService.doctor.findMany({
            where: {
                affiliatedHospitalId: hospitalUser.id
            },
            select:{
                name:true,
                email:true,
                contactNumber:true,
                specialization:true,
                gender:true,
                address:true,
                rating:true,
                _count: {
                    select: {
                        appointments: true
                    }
                }
            }
        });
    }
}
