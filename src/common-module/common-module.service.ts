import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Doctor, DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { UserEntity } from "../dto/UserEntity.dto";
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import { RedisClientType } from 'redis';
import { RedisProvider } from 'src/redis/redis.provider';
import exp from 'constants';
import e from 'express';
@Injectable()
export class CommonModuleService {
    constructor(private prismaService:PrismaService, private readonly redisProvider: RedisProvider){}

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

    async getDoctors(speciality: DoctorSpecialization){
        try {

            // console.log("Speciality: ", speciality)
            const cacheKey = speciality ? `doctorsSpeciality:${speciality}` : 'doctors';

            const cachedData = await this.redisProvider.getClient().get(cacheKey);
            if(cachedData){
                return {doctors: JSON.parse(cachedData)};
            }

            const doctors = await this.prismaService.doctor.findMany({
                where:{
                    specialization: speciality || undefined
                },
                orderBy:{
                    rating: 'desc'
                }
            });

            doctors.forEach(doctor => {
                delete doctor.password;
            });
            
            await this.redisProvider.getClient().setEx(cacheKey, 60 * 15, JSON.stringify(doctors));
            
            return {doctors};
        } catch (error) {
            console.log(error.meassage)
            return {error: error.message}
        }
    }
    
    async getHospitals(speciality: HospitalSpeciality){

        let hospitals: any;

        const cacheKey = speciality ? `hospitalsSpeciality:${speciality}` : 'hospitals';

        // Check if data is cached
        const cachedData = await this.redisProvider.getClient().get(cacheKey);
        if (cachedData) {
            // console.log('Cache Hit');
            return {hospitals :JSON.parse(cachedData)};
        }

        hospitals = await this.prismaService.hospital.findMany({
            where:{
                speciality: speciality || undefined,
            }
        });

        hospitals.forEach(hospital => {
            delete hospital.password;
        });

        // console.log('Cache Miss')
        
        await this.redisProvider.getClient().setEx(cacheKey, 60 * 15, JSON.stringify(hospitals));
        

        return {hospitals};
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
        return {doctor};
    }

    async getHospitalById(id: string){
        const hospital = await this.prismaService.hospital.findUnique({
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

        delete hospital.password;

        return {hospital};
    }

}