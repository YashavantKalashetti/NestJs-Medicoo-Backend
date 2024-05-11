import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppointmentStatus, Patient, Prescription, PrescriptionStatus, Prisma } from '@prisma/client';
import { CreateAppointmentDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';
import { platform } from 'os';

@Injectable()
export class PatientService {

    constructor(private prismaService:PrismaService){}

    async getPrescriptions(user: Patient): Promise<Prescription[]>{  
        return this.prismaService.prescription.findMany({
            where: {
                patientId: user.id
            }
        });
    }

    async bookAppointment(user: Patient, appointmentDto: CreateAppointmentDto, status?: AppointmentStatus): Promise<string>{
        
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id: appointmentDto.doctorId
            }
        });
        
        if(!doctor){
            throw new BadRequestException("Doctor not found");
        }

        if(!status){
            const existsAppointment = await this.prismaService.appointment.findFirst({
                where: {
                    AND: [
                        { patientId: user.id },
                        { doctorId: appointmentDto.doctorId }
                    ]
                }
            });

            if(existsAppointment){
                throw new BadRequestException("Appointment already exists");
            }
        }

        const appointment = await this.prismaService.appointment.create({
            data: {
                patientId: user.id,
                status: status,
                ...appointmentDto,
            }
        });

        if(!appointment){
            throw new InternalServerErrorException("Appointment not booked");
        }

        // const platformId = "111";

        // await this.prismaService.platform.update({
        //     where:{
        //         id: platformId
        //     },
        //     data:{
        //         totalAppointments: {
        //             increment: 1
        //         }
        //     }
        // })

        return appointment.id;
        
    }

    async getAppointments(user: Patient){
        return this.prismaService.appointment.findMany({
            where: {
                patientId: user.id
            }
        });
    }

    async reviewAppointment(user: Patient, appointmentDto: CreateAppointmentDto, rating: number){

        const appointment = await this.prismaService.appointment.findFirst({
            where: {
                AND: [
                    { patientId: user.id },
                    { doctorId: appointmentDto.doctorId }
                ]
            }
        });

        if(!appointment){
            throw new BadRequestException("Appointment not found");
        }

        await this.prismaService.appointment.delete({
            where: {
                id: appointment.id
            }
        });

        if(!rating){
            return "Rating is required";
        }

        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id: appointment.doctorId
            },
        });

        const totalAppointments = doctor.totalAppointments
  
        const updatedRating = ((doctor.rating || 0) * (doctor.totalAppointments || 0) + rating) / ((doctor.totalAppointments || 0) + 1);

        const updatedDoctor = await this.prismaService.doctor.update({
            where: {
                id: doctor.id
            },
            data: {
                rating: updatedRating,
                totalAppointments: {
                    increment: 1
                }
            }
        });

        if(!updatedDoctor){
            throw new InternalServerErrorException("Doctor not updated");
        }

        return "Doctor reviewed successfully";
    }

    async inactivePrescriptions(user: Patient): Promise<Prescription[]>{
        const inactivePrescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: user.id,
                status: PrescriptionStatus.INACTIVE
            }
        });

        return inactivePrescriptions;
    }

    async deletePrescription(user: Patient, id: string): Promise<string>{
        const deletedPrescription = await this.prismaService.prescription.delete({
            where: {
                id: id,
                patientId: user.id,
                status: PrescriptionStatus.INACTIVE
            }
        });

        if(!deletedPrescription){
            throw new BadRequestException("Prescription not found");
        }

        return "Prescription deleted successfully";
    }

}
