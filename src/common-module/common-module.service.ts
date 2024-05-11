import { BadRequestException, Injectable } from '@nestjs/common';
import { Doctor } from '@prisma/client';
import { UserEntity } from "../dto/UserEntity.dto";
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommonModuleService {
    constructor(private prismaService:PrismaService){}

    async getDetailsOfPlatform(){
        const doctorsCount = await this.prismaService.doctor.count();
        const hospitalsCount = await this.prismaService.hospital.count();
        const patientsCount = await this.prismaService.patient.count();

        const appointmentsCount = await this.prismaService.doctor.aggregate({
            _count:{
                totalAppointments:true
            }
        });

        return {
            doctorsCount,
            hospitalsCount,
            patientsCount,
            appointmentsCount
        } 

    }

    async getDoctors(){
        try {
            const doctors = await this.prismaService.doctor.findMany({
            });

            doctors.forEach(doctor => {
                delete doctor.password;
            });
            return doctors;
        } catch (error) {
            console.log(error.meassage)
            throw new BadRequestException('Error getting doctors');
        }
    }
    
    async getHospitals(){
        const hospitals = await this.prismaService.hospital.findMany({
            include:{
                _count:{
                    select:{
                        doctors:true
                    }
                }
            }
        });

        hospitals.map(hospital => {
            delete hospital.password;
        });

        return hospitals;
        
    }

    async getDoctorById(id: string){
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id
            },
            include:{
                affiliatedHospital:{
                    select:{
                        name:true,
                        email:true,
                        address:true,
                        contactNumber:true,
                    }
                }
            }
        });

        delete doctor.password;

        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }

        return doctor;
    }

    async getHospitalById(id: string){
        const hospital = await this.prismaService.hospital.findUnique({
            where: {
                id
            },
            include:{
                doctors:{
                    select:{
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        rating:true,
                    }
                }
            }
        });

        if (!hospital) {
            throw new BadRequestException('Hospital not found');
        }

        delete hospital.password;

        return hospital;
    }

    
}
