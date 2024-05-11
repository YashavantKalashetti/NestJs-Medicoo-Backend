import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Doctor, PrescriptionStatus } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorService {
    constructor(private prismaService: PrismaService) {}

    async getAppointments(user: Doctor) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
        const appointments = await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { doctorId: user.id },
                    { date: { gte: startOfToday, lt: endOfToday } }
                ]
            },
            include: {
                patient: {
                    select: {
                        name: true,
                        email: true,
                        contactNumber: true,
                        gender: true,
                        dob: true,
                    },
                }
            }
        });
    
        if (!appointments || appointments.length === 0) {
            return [];
        }
    
        const allAppointments = appointments.map((app) => {
            const clonedAppointment = { ...app };
            (clonedAppointment.patient as any).age = this.calculateAge(app.patient.dob);
            return clonedAppointment;
        });
    
        return allAppointments;
    }
    
    async viewPrescriptionById(patientId: string) {
        return this.prismaService.prescription.findMany({
            where: {
                patientId
            },
            include:{
                medications: true
            }
        });
    }


    async addPrescriptions(user: Doctor, patientId: string, prescriptionDto: CreatePrescriptionDto) {

        const {attachment, instructionForOtherDoctor, medicationType, status} = prescriptionDto;

        const prescription = await  this.prismaService.prescription.create({
            data: {
                doctorId: user.id,
                patientId,
                attachment, instructionForOtherDoctor, medicationType, status
            }
        });

        if(!prescription){
            throw new InternalServerErrorException("Prescription could not be created");
        }

        // console.log("Prescription created")

        prescriptionDto.medication.map(async (medication) => {

            // This is just for understanding purposes
            // const {medicine, dosage, numberOfDays,  instruction} = medication;

            await this.prismaService.medication.create({
                data: {
                    ...medication,
                    prescription: { connect: { id: prescription.id } }
                }
            });

        });

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
        // });

        return prescription;
    }
    
    async deletePrescriptionRequest(user: Doctor, prescriptionId: string) {
        const prescription = await this.prismaService.prescription.update({
            where: {
                id: prescriptionId,
                doctorId: user.id,
            },
            data:{
                status: PrescriptionStatus.INACTIVE
            }
        });

        if(!prescription){
            throw new ForbiddenException("You are not authorized to delete this prescription");
        }

        // const platformId = "111";

        // await this.prismaService.platform.update({
        //     where:{
        //         id: platformId
        //     },
        //     data:{
        //         totalAppointments: {
        //             decrement: 1
        //         }
        //     }
        // });

        return "Status has been updated to INACTIVE";
    }


    private calculateAge(dateOfBirth: Date): number {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
    }
}
