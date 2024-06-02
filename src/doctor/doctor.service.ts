import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Doctor, PrescriptionStatus } from '@prisma/client';
import { CreatePrescriptionDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DoctorService {
    constructor(private prismaService: PrismaService,private config: ConfigService) {}

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

        const offlineAppointments = allAppointments.filter(appointment => appointment.mode === "OFFLINE");
        const onlineAppointments = allAppointments.filter(appointment => appointment.mode === "ONLINE");
    
        return {offlineAppointments, onlineAppointments};
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

        const {attachments, instructionForOtherDoctor, medicationType, status} = prescriptionDto;

        const prescription = await  this.prismaService.prescription.create({
            data: {
                doctorId: userId,
                patientId,
                attachments, instructionForOtherDoctor, medicationType, status
            }
        });

        if (attachments && attachments.length > 0) {
            await this.handelElasticSearchEntries(attachments, patientId, prescription.id);
        }        
            
        if(!prescription){
            throw new InternalServerErrorException("Prescription could not be created");
        }

        prescriptionDto?.medication?.map(async (medication) => {

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

    async getPatientReportsById(patientId: string, search: string="") {
        search = search?.trim();
        if(search == ""){

            const attachments = await this.prismaService.prescriptionAttachementElasticSearch.findMany({
                where:{
                    patientId,
                }
            });

            const urls = attachments.map(attachment => attachment.url);

            return urls;

        }

        const response = await fetch(`${this.config.get('Elastic_Server')}/elasticSearch-reports`, {
            method: 'POST',
            body: JSON.stringify({
                patientId,
                searchText: search
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        if(!response.ok){
            new InternalServerErrorException("Error in fetching data from elastic search");
        }

        const { files } = await response.json();

        // console.log(files);

        const documents = files?.map(file => file.documentId);

        const attachments = await this.prismaService.prescriptionAttachementElasticSearch.findMany({
            where:{
                id: {
                    in: documents
                },
            }
        });
        
        const urls = attachments.map(attachment => attachment.url);

        return urls;
        
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

    private async handelElasticSearchEntries(attachments: string[], patientId: string, prescriptionId: string){
        await Promise.all(attachments?.map(async (attachment: string) => {

            try {
                const elasticEntry = await this.prismaService.prescriptionAttachementElasticSearch.create({
                    data:{
                        patientId,
                        prescriptionId,
                        url: attachment
                    }
                });

                console.log(elasticEntry.id)

                await this.getFileType(attachment, patientId, elasticEntry.id);


            } catch (error) {
                console.log(error.message);
            }

        }));
    }

    private async getFileType(url, patientId, databaseId) {
        try {
            const splitUrl = url.split('.');
            const fileExtension = splitUrl[splitUrl.length - 1];

            switch (fileExtension) {
                case 'pdf':
                case 'doc':
                case 'docx':
                    console.log(fileExtension)
                    await axios.post(`${this.config.get('Elastic_Server')}/pdfToText`, {
                        databaseId,
                        patientId,
                        url
                    });
                    return 'pdf';
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'bmp':
                case 'tiff':
                case 'webp':
                case 'avif':
                    console.log(fileExtension)
                    await axios.post(`${this.config.get('Elastic_Server')}/imageToText`, {
                        databaseId,
                        patientId,
                        url
                    });
                    return 'image';
                default:
                    console.log(fileExtension)
                    return 'unknown';
            }
            
        } catch (error) {
            console.error('Error fetching file type:', error.message);
        }
    }


}
