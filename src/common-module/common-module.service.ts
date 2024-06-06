import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Doctor, DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { UserEntity } from "../dto/UserEntity.dto";
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';

@Injectable()
export class CommonModuleService {
    constructor(private prismaService:PrismaService, @Inject('REDIS_CLIENT') private readonly redisClient: Redis){}

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

    async getNearbyHospitals(body: {latitude: string, longitude:string}){
        const {latitude, longitude} = body;
        // const hospitalsWithinRange = await this.prismaService.hospital.findMany({
        //     where: {
        //         latitude: {
        //             gte: parseFloat(latitude) - 0.3,
        //             lte: parseFloat(latitude) + 0.3
        //         },
        //         longitude: {
        //             gte: parseFloat(longitude) - 0.3,
        //             lte: parseFloat(longitude) + 0.3
        //         }
        //     },
        //     orderBy: {
        //         latitude: 'asc', // Order by latitude
        //         longitude: 'asc' // Then order by longitude
        //     },
        // });
        // return hospitalsWithinRange;

        
    }

    async getDoctors(){
        try {
            let doctors: any;
            doctors = await this.redisClient.get('doctors');
            if(doctors){
                console.log('Cache Hit')
                doctors = JSON.parse(doctors);
                return doctors;
            }
            doctors = await this.prismaService.doctor.findMany({
            });

            doctors.forEach(doctor => {
                delete doctor.password;
            });
            
            this.redisClient.set('doctors', JSON.stringify(doctors), 'EX', 60*10);
            return doctors;
        } catch (error) {
            console.log(error.meassage)
            throw new BadRequestException('Error getting doctors');
        }
    }
    
    async getHospitals(){
        let hospitals: any;

        hospitals = await this.redisClient.get('hospitals')


        if(hospitals){
            console.log('Cache Hit')
            hospitals = JSON.parse(hospitals);
            return hospitals;
        }

        hospitals = await this.prismaService.hospital.findMany({
        });

        hospitals.forEach(hospital => {
            delete hospital.password;
        });

        await this.redisClient.set('hospitals', JSON.stringify(hospitals), 'EX', 60*10);
        console.log('Cache Miss')

        return hospitals;
    }

    async getHospitalBySpeciality(speciality: HospitalSpeciality){

        if(speciality && !HospitalSpeciality[speciality]){
            throw new BadRequestException('Speciality must be a valid value given in the enum');
        }

        let hospitals: any;

        hospitals = await this.redisClient.get(`hospitals:${speciality}`);

        if(hospitals){
            console.log('Cache Hit')
            hospitals = JSON.parse(hospitals);
            hospitals = hospitals.filter(hospital => hospital.speciality === speciality);
            return hospitals;
        }

        hospitals = await this.prismaService.hospital.findMany({
            where:{
                speciality
            }
        });

        if (!hospitals) {
            throw new BadRequestException('Hospital not found');
        }

        hospitals.forEach(hospital => {
            delete hospital.password;
            delete hospital.latitude;
            delete hospital.longitude;
        });

        await this.redisClient.set(`hospitals:${speciality}`, JSON.stringify(hospitals), 'EX', 60*10);
        console.log('Cache Miss')

        return hospitals;
    }

    async getDoctorBySpecialization(specialization: DoctorSpecialization){

        if(specialization && !DoctorSpecialization[specialization]){
            throw new BadRequestException('Specialization must be a valid value given in the enum');
        }

        const doctors = await this.prismaService.doctor.findMany({
            where: {
                specialization
            }
        });

        if (!doctors) {
            throw new BadRequestException('Doctors not found');
        }

        doctors.forEach(doctor => {
            delete doctor.password;
            delete doctor.createdAt;
            delete doctor.updatedAt;
        });

        return doctors;
    }

    async getDoctorById(id: string){
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id
            },
            include:{
                affiliatedHospitals:{
                    select:{
                        id:true,
                        name:true,
                        contactNumber:true,
                        email:true,
                        address:true,
                        latitude:true,
                        longitude:true,
                    }
                }
            }
        });

        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }

        delete doctor.password;
        return doctor;
    }

    async getHospitalById(id: string){
        const hospital = await this.prismaService.hospital.findMany({
            where:{
                id
            },
            include:{
                registeredDoctors:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        rating:true,
                        totalAppointments:true,
                    }
                }
            }
          });

        if (!hospital) {
            throw new BadRequestException('Hospital not found');
        }

        return hospital;
    }

}