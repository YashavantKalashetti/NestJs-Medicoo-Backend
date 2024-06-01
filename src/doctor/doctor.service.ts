import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Doctor, PrescriptionStatus } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorService {
    constructor(private prismaService: PrismaService) {}

    async getMyDetails_Doctor(userId: string) {
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id: userId
            },
            include: {
                affiliatedHospitals: {
                    select: {
                        name: true,
                        address: true,
                        contactNumber: true,
                        email: true,
                    }
                }
            },
        });

        const appointmentCount = await this.prismaService.appointment.count({
            where: {
                patientId: userId
            }
        });

        delete doctor.password;
        return {doctor,appointmentCount};
    }

    async getAppointments(userId: string) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
        const appointments = await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { doctorId: userId },
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
    
    async getPatientPrescriptionById(patientId: string) {
        return this.prismaService.prescription.findMany({
            where: {
                patientId
            },
            include:{
                medications: true
            }
        });
    }

    async getPatientMedicationsById(patientId: string) {
        const prescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: patientId,
            },
            select:{
                medications: true
            }
        });

        return this.ismedicationValid(prescriptions);
    }

    async addPrescriptions(userId: string, patientId: string, prescriptionDto: CreatePrescriptionDto) {

        const {attachment, instructionForOtherDoctor, medicationType, status} = prescriptionDto;

        const prescription = await  this.prismaService.prescription.create({
            data: {
                doctorId: userId,
                patientId,
                attachment, instructionForOtherDoctor, medicationType, status
            }
        });

        if(!prescription){
            throw new InternalServerErrorException("Prescription could not be created");
        }

        prescriptionDto.medication.map(async (medication) => {

            // This is just for understanding purposes
            // const {medicine, dosage, numberOfDays,  instruction} = medication;

            const date = Date.now();
            let currentDate = new Date(date);
            currentDate.setDate(currentDate.getDate() + medication.numberOfDays);
            const validtill = currentDate.toISOString();

            await this.prismaService.medication.create({
                data: {
                    ...medication,
                    validTill: validtill,
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
    
    async deletePrescriptionRequest(userId: string, prescriptionId: string) {
        const prescription = await this.prismaService.prescription.update({
            where: {
                id: prescriptionId,
                doctorId: userId,
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

    async divergeAppointments(doctorId: string, oldDoctorId: string, newDoctorId: string, appointmentId: string) {
        const appointment = await this.prismaService.appointment.update({
            where:{
                id: appointmentId,
                doctorId: oldDoctorId,
                hospitalId: null,
            },
            data:{
                doctorId: newDoctorId
            }
        });

        if(!appointment){
            throw new InternalServerErrorException("Appointment could not be updated");
        }

        return appointment;
    }

    // helpers

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
