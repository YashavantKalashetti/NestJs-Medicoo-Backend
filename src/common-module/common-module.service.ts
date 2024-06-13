import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Doctor, DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { UserEntity } from "../dto/UserEntity.dto";
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import { RedisClientType } from 'redis';
import { RedisProvider } from 'src/redis/redis.provider';
import exp from 'constants';
import e from 'express';
import { ConfigService } from '@nestjs/config';
import { stat } from 'fs';
import { Prisma } from '@prisma/client';
@Injectable()
export class CommonModuleService {
    constructor(private prismaService:PrismaService, private readonly redisProvider: RedisProvider, private configService: ConfigService){}

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

    async getNearbyHospitals(userLatitude: Number, userLongitude: Number, speciality: HospitalSpeciality){

        if(!userLatitude || !userLongitude){
            throw new BadRequestException('Please provide latitude and longitude');
        }

        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const toRadians = (angle) => angle * (Math.PI / 180);
            const R = 6371; // Radius of the Earth in kilometers
            const dLat = toRadians(lat2 - lat1);
            const dLon = toRadians(lon2 - lon1);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) *
                Math.cos(toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // Distance in kilometers
            return distance;
        };
          
        const hospitals = await this.prismaService.hospital.findMany({
            where:{
                speciality: speciality || undefined,
                availableForConsult: true
            },
            select:{
                id:true,
                name:true,
                contactNumber:true,
                email:true,
                address:true,
                latitude:true,
                longitude:true,
                speciality:true,
                availableForConsult: true,
            }
        });
        
        const nearestHospitals = hospitals.map((hospital) => {
            const distance = haversineDistance(
              userLatitude,
              userLongitude,
              hospital.latitude,
              hospital.longitude
            );
            return {
              ...hospital,
              distance,
            };
        });
        
        nearestHospitals.sort((a, b) => a.distance - b.distance);
        
        return { nearestHospitals };
          
    }

    async emergencyConsult(hospitalId: string, reason: string, latitude: Number, longitude: Number, patientId: string){

        if(!latitude || !longitude){
            throw new BadRequestException('Please Provide Location to send emergency consultation request');
        }

        const { hospital } = await this.getHospitalById(hospitalId);

        let emergencyMessage = `Emergency Consultation Request: Coordinates - Latitude: ${latitude}, Longitude: ${longitude}`;

        if(!patientId){
            patientId = "EMERGENCY PATIENT"
        }else if(patientId){
            const user = await this.prismaService.patient.findUnique({
                where:{
                    id: patientId
                },
                select:{
                    id:true,
                    name:true,
                    contactNumber:true,
                    parentId:true
                }
            });

            if(user){
                emergencyMessage = `Emergency Consultation Request from  Patient:  ${user.name} - ${user.contactNumber} - PatientId : ${user.id}. Previously located at : Latitude: ${latitude}, Longitude: ${longitude}`;
                const parntEmergencyMessage = `Patient ${user.name} - ${user.contactNumber} - PatientId : ${user.id}. Previously located at : Latitude: ${latitude}, Longitude: ${longitude}`;

                if(user.parentId){
                    try {
                        const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/notification/sendEmergencyMessage`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                receiverId: user.parentId,
                                status: 'EMERGENCY',
                                message: parntEmergencyMessage,
                                senderId: user.id
                            })
                        });

                        if(response.ok){
                            console.log('Parent Emergency Message Sent')
                        }
                    } catch (error) {
                        console.log(error.message)
                    }

                }

                const currentDayPrevAppointment = await this.prismaService.appointment.findFirst({
                    where:{
                        patientId: user.id,
                        status: 'EMERGENCY',
                        AND:[
                            {
                                createdAt:{
                                    gte: new Date(new Date().setHours(0,0,0,0))
                                }
                            }
                        ]
                    }
                });

                if(!currentDayPrevAppointment){
                    await this.prismaService.appointment.create({
                        data:{
                            patientId: user.id,
                            status: 'EMERGENCY',
                            reason: reason || 'Emergency Consultation',
                        }
                    });
                }
            }
        }

        try {
            const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/notification/sendEmergencyMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    receiverId: hospitalId,
                    status: 'EMERGENCY',
                    message: emergencyMessage,
                    senderId: patientId
                })
            });
    
    
            if(!response.ok){
                throw new BadRequestException("Error sending emergency consultation request. Please try again");
            }

            return { msg: "Emergency Consultation Request Sent" }
        } catch (error) {
            console.log(error.message)
            return {msg :"Hosptal is currently offline. But the request is still notified Please try again later"};
        }

    }

    async getDoctors(specialization: DoctorSpecialization, page: number=1, perPage: number=12){
        try {

            // console.log("Speciality: ", speciality)
            const cacheKey = specialization ? `doctorsSpeciality:${specialization}` : 'doctors';

            const cachedData = await this.redisProvider.getClient().get(cacheKey);
            if(cachedData){
                return {doctors: JSON.parse(cachedData)};
            }

            const doctors = await this.prismaService.doctor.findMany({
                where:{
                    specialization: specialization || undefined,
                },
                orderBy:{
                    rating: 'desc'
                },
                select:{
                    id:true,
                    name:true,
                    specialization:true,
                    rating:true,
                    avatar:true,
                    consultingFees:true,
                    availableForConsult:true,
                },take: perPage, skip: (page - 1) * perPage
            });

            
            await this.redisProvider.getClient().setEx(cacheKey, 60 * 15, JSON.stringify(doctors));
            
            return {doctors};
        } catch (error) {
            console.log(error.meassage)
            return {error: error.message}
        }
    }
    
    async getHospitals(speciality: HospitalSpeciality, page: number=1, perPage: number=12){

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
            },
            select:{
                id:true,
                name:true,
                contactNumber:true,
                email:true,
                address:true,
                speciality:true,
                availableForConsult: true,
            },take: perPage, skip: (page - 1) * perPage
        });

        hospitals.forEach(hospital => {
            delete hospital.password;
        });

        // console.log('Cache Miss')
        
        await this.redisProvider.getClient().setEx(cacheKey, 60 * 15, JSON.stringify(hospitals));

        return { hospitals };
    }

    async getDoctorById(id: string){
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id
            },
            select:{
                id:true,
                name:true,
                specialization:true,
                rating:true,
                consultingFees:true,
                education:true,
                avatar:true,
                practicingSince:true,
                availableStartTime:true,
                availableEndTime:true,
                availableForConsult:true,
                affiliatedHospitals:{
                    select:{
                        id:true,
                        name:true,
                        contactNumber:true,
                        address:true,
                    }
                }
            }
        });

        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }

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
                        consultingFees:true,
                        practicingSince:true,
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

        return {hospital};
    }
    
}