import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Doctor, DoctorSpecialization, Hospital, HospitalSpeciality } from '@prisma/client';
import { UserEntity } from "../dto/UserEntity.dto";
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import { RedisClientType } from 'redis';
import { RedisProvider } from 'src/redis/redis.provider';
import exp from 'constants';
import e, { response } from 'express';
import { ConfigService } from '@nestjs/config';
import { stat } from 'fs';
import { Prisma } from '@prisma/client';
import { RealTimeNotification } from 'src/Services/RealTimeNotification';
import { WhatsAppMessage } from 'src/Services/WhatsAppNotification';
import { generate } from 'rxjs';
import { generateOTP } from 'src/Services/GenerateOTP';
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

        
        return { hospitals : nearestHospitals };
          
    }

    async emergencyConsult(hospitalId: string, reason: string, latitude: Number, longitude: Number, patientId: string){

        if(!latitude || !longitude){
            throw new BadRequestException('Please Provide Location to send emergency consultation request');
        }

        const { hospital } = await this.getHospitalById(hospitalId);
        // Whtsapp Alert contacts
        const contacts: String[] = [];

        let hospitalEmergencyMessage = `Emergency Consultation Request: Coordinates - Latitude: ${latitude}, Longitude: ${longitude}`;

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
                    parent:true,
                    patient_number:true,
                }
            });

            if(user){
                hospitalEmergencyMessage = `Emergency Consultation Request from  Patient:  ${user.name} - ${user.contactNumber} - PatientId : ${user.patient_number}. Previously located at : Latitude: ${latitude}, Longitude: ${longitude}`;
                const parntEmergencyMessage = `Patient ${user.name} - ${user.contactNumber} - PatientId : ${user.patient_number}. Previously located at : Latitude: ${latitude}, Longitude: ${longitude}`;

                if(user.parent && user.parent.id){
                    await RealTimeNotification(user.id, user.parent.id, parntEmergencyMessage);
                    contacts.push(user.parent.contactNumber);
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
            const hospitalNotificationStatus = await RealTimeNotification(patientId, hospital.id, hospitalEmergencyMessage);
            contacts.push(hospital.contactNumber);
            try { 
                WhatsAppMessage(contacts, hospitalEmergencyMessage);
            } catch (error) {
            }
    
            if(!hospitalNotificationStatus){
                return {msg :"Hospital is currently offline. But the request is still notified Please try again later"};
            }
        } catch (error) {
            // console.log(error)
            return {msg : "Hospital is currently offline. But the request is still notified Please try again later"};
        }

        return { msg: "Emergency Consultation Request Sent." }

    }

    async getDoctors(specialization: DoctorSpecialization, page?: number, perPage?: number){
        try {

            const currentPage = isNaN(Number(page)) ? 1 : Number(page);
            const currentPerPage = isNaN(Number(perPage)) ? 12 : Number(perPage);

            // console.log("Speciality: ", speciality)
            const cacheKey = specialization ? `doctorsSpeciality-${page}-${specialization}` : 'doctors';

            const cachedData = await this.redisProvider.getClient().get(cacheKey);
            if(cachedData){
                return {doctors: JSON.parse(cachedData)};
            }

            // console.log("Page: ", currentPage, "Specialization: ", specialization, "PerPage: ", currentPerPage)

            const doctors = await this.prismaService.doctor.findMany({
                where:{
                    specialization: specialization || undefined,
                },
                skip: (currentPage - 1) * currentPerPage,
                orderBy:{
                    rating: 'desc'
                },
                select:{
                    id:true,
                    name:true,
                    doctor_number:true,
                    specialization:true,
                    rating:true,
                    avatar:true,
                    availableForConsult:true,
                    education:true,
                    languages:true,
                    practicingSince:true,
                },  take: currentPerPage,
            });

            
            // await this.redisProvider.getClient().setEx(cacheKey, 60 * 15, JSON.stringify(doctors));
            
            return {doctors};
        } catch (error) {
            console.log(error)
            return new InternalServerErrorException('Error fetching doctors');
        }
    }
    
    async getHospitals(speciality: HospitalSpeciality, page?: number, perPage?: number){
        

        const currentPage = isNaN(Number(page)) ? 1 : Number(page);
        const currentPerPage = isNaN(Number(perPage)) ? 12 : Number(perPage);

        const cacheKey = speciality ? `hospitalsSpeciality:${speciality}` : 'hospitals';

        // Check if data is cached
        const cachedData = await this.redisProvider.getClient().get(cacheKey);
        if (cachedData) {
            // console.log('Cache Hit');
            return {hospitals :JSON.parse(cachedData)};
        }

        let hospitals = await this.prismaService.hospital.findMany({
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
            },skip: (currentPage - 1) * currentPage, take: currentPerPage, 
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

        const { startOfToday } = this.IndianTime();

        const { availableSlotsByDate }  = await this.getDoctorAvailableTimeSlots(id, new Date(startOfToday))

        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }

        return {doctor, availableSlotsByDate};
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
                        doctor_number:true,
                        specialization:true,
                        rating:true,
                        avatar:true,
                        availableForConsult:true,
                        education:true,
                        languages:true,
                        practicingSince:true,
                    }
                }
            }
        });

        if (!hospital) {
            throw new BadRequestException('Hospital not found');
        }

        delete hospital.password;

        return { hospital };
    }

    async getDoctorAvailableTimeSlots(doctorId: string, date: Date) {
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id: doctorId
            },
            select: {
                id: true,
                availableStartTime: true,
                availableEndTime: true,
            }
        });
    
        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }
    
        const timeSlots = this.get15MinuteIntervals(doctor.availableStartTime, doctor.availableEndTime);
    
        // Get today and the next 4 days excluding Sundays
        const dates = [];
        let currentDate = new Date(date);
        while (dates.length < 5) {
            if (currentDate.getDay() !== 0) { // 0 represents Sunday
                dates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        const availableSlotsByDate = [];
    
        for (const date of dates) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
    
            const appointments = await this.prismaService.appointment.findMany({
                where: {
                    doctorId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                select: {
                    date: true,
                },
            });
    
            const bookedTimes = new Set(
                appointments.map(appointment =>
                    this.formatTime(new Date(appointment.date))
                )
            );
    
            const availableSlots = timeSlots.map(time => ({
                time,
                isBooked: bookedTimes.has(time),
            }));
    
            availableSlotsByDate.push({
                date: date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                availableSlots
            });
        }
    
        return { availableSlotsByDate };
    }
    
    async isHospitalAvailableForConsultation(hospitalId: string){
        const hospital = await this.prismaService.hospital.findUnique({
            where:{
                id: hospitalId
            },
            select:{
                availableForConsult:true
            }
        });

        if(!hospital){
            throw new BadRequestException('Hospital not found');
        }

        return {availableForConsult: hospital.availableForConsult};
    }
    // Helpers
    
    private get15MinuteIntervals(start: string, end: string): string[] {
        const startTime = this.parseTime(start);
        const endTime = this.parseTime(end);
        const intervals: string[] = [];
    
        let current = startTime;
        while (current <= endTime) {
            intervals.push(this.formatTime(current));
            current.setMinutes(current.getMinutes() + 15);
        }
        
        return intervals;
    }
    
    private parseTime(time: string): Date {
        const [hour, minute] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date;
    }
    
    private formatTime(date: Date): string {
        return date.toTimeString().slice(0, 5);
    }

    private IndianTime(){
        const indianTime = new Date();
        indianTime.setUTCHours(indianTime.getUTCHours() + 5); // Add 5 hours for Indian Standard Time
        indianTime.setUTCMinutes(indianTime.getUTCMinutes() + 30); // Add additional 30 minutes for Indian Standard Time
    
        const startOfToday = new Date(indianTime);
        startOfToday.setUTCHours(0, 0, 0, 0);
    
        const endOfToday = new Date(indianTime);
        endOfToday.setUTCHours(23, 59, 59, 999);

        return {startOfToday, endOfToday, indianTime};
    }
    

}