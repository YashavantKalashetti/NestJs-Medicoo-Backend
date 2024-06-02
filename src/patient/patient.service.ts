import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppointmentStatus, Patient, Prescription, PrescriptionStatus, Prisma } from '@prisma/client';
import { CreateAppointmentDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';
import { platform } from 'os';
import { NotFoundError } from 'rxjs';

@Injectable()
export class PatientService {

    constructor(private prismaService:PrismaService){}

    async getMyDetails_Patient(userId: string){
        const patient = await this.prismaService.patient.findUnique({
            where: {
                id: userId
            }
        });

        const appointmentCount = await this.prismaService.appointment.count({
            where: {
                patientId: userId
            }
        });

        const medicationCount = await this.prismaService.prescription.count({
            where: {
                patientId: userId
            }
        });

        return {patient, appointmentCount, medicationCount};
    }

    async getPrescriptions(userId: string): Promise<Prescription[]>{  
        return this.prismaService.prescription.findMany({
            where: {
                patientId: userId
            }
        });
    }

    async getPrescriptionById(userId: string, prescriptionId: string): Promise<Prescription>{
        const prescription = await this.prismaService.prescription.findFirst({
            where: {
                id: prescriptionId,
                patientId: userId
            },
            include:{
                medications: true
            }
        });

        if(!prescription){
            throw new BadRequestException("Prescription not found");
        }

        return prescription;
    }

    async getAllCurrentMedications(userId: string){
        const prescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId,
            },
            select:{
                medications: true
            }
        });

        return this.ismedicationValid(prescriptions);
    }

    async bookAppointment(userId: string, appointmentDto: CreateAppointmentDto, status?: AppointmentStatus): Promise<string>{
        
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
                        { patientId: userId },
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
                patientId: userId,
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

    async getAppointments(userId: string){
        return this.prismaService.appointment.findMany({
            where: {
                patientId: userId
            }
        });
    }

    async reviewAppointment(userId: string, appointmentDto: CreateAppointmentDto, rating: number){

        const appointment = await this.prismaService.appointment.findFirst({
            where: {
                AND: [
                    { patientId: userId },
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

    async inactivePrescriptions(userId: string): Promise<Prescription[]>{
        const inactivePrescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId,
                status: PrescriptionStatus.INACTIVE
            }
        });

        return inactivePrescriptions;
    }

    async deletePrescription(userId: string, id: string): Promise<string>{
        const deletedPrescription = await this.prismaService.prescription.delete({
            where: {
                id: id,
                patientId: userId,
                status: PrescriptionStatus.INACTIVE
            }
        });

        if(!deletedPrescription){
            throw new BadRequestException("Prescription not found");
        }

        return "Prescription deleted successfully";
    }


    // Helpers

    private ismedicationValid(prescriptions){
        const allMedications = [];
        prescriptions.map(prescription => {
            prescription.medications.filter(medication => {
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                let date = new Date(medication.validTill);
                date.setHours(0, 0, 0, 0);

                if (date >= today) {
                    allMedications.push(medication);
                }
            })
        });
        return allMedications;
    }

}
