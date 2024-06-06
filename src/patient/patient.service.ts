import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Appointment, AppointmentStatus, Doctor, Patient, Prescription, PrescriptionStatus, Prisma } from '@prisma/client';
import { CreateAppointmentDto } from '../dto';
import { PrismaService } from '../prisma/prisma.service';
import { platform } from 'os';
import { NotFoundError } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PatientService {

    constructor(private prismaService:PrismaService, private config: ConfigService){}

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

    async getMedicalReports(patientId: string, search: string=""){
        search = search?.trim();
        if(search == "" || search == null){

            const attachments = await this.prismaService.prescriptionAttachementElasticSearch.findMany({
                where:{
                    patientId,
                }
            });

            const urls = attachments.map(attachment => attachment.url);

            return urls;

        }

        const response = await fetch(`${this.config.get('Elastic_Server')}/elasticSearch/med-reports`, {
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

    async bookAppointment(userId: string, appointmentDto: CreateAppointmentDto, status?: AppointmentStatus){
        
        const doctor = await this.prismaService.doctor.findUnique({
            where:{
                id: appointmentDto.doctorId
            }
        });
        if (!doctor) {
          throw new BadRequestException('Doctor not found');
        }
    
        const nextAvailableSlot = await this.isSlotAvailable(doctor);
        if (!nextAvailableSlot) {
          throw new BadRequestException('Appointment slot is not available');
        }

        // console.log("Slot Available: ",nextAvailableSlot)

        // await this.prismaService.appointment.deleteMany()
    
        const appointment = await this.prismaService.appointment.create({
            data: {
                reason: appointmentDto.reason,
                date: nextAvailableSlot,
                patient:{
                    connect:{
                        id: userId
                    }
                },
                doctor:{
                    connect:{
                        id: appointmentDto.doctorId
                    }
                }
            },
        });
    
        return appointment;
        
    }

    async getAppointments(userId: string){
        const {startOfToday, endOfToday} =  this.IndianTime();
    
        const existingAppointments = await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { patientId: userId},
                    { date: { gte: startOfToday, lt: endOfToday } },
                    {status: "NORMAL" || "EMERGENCY"},
                ]
            },
            orderBy: {
                date: 'desc'
            }
        });

        const onlineAppointments = existingAppointments.filter(appointment => appointment.mode == "ONLINE");
        const offlineAppointments = existingAppointments.filter(appointment => appointment.mode == "OFFLINE");

        return {onlineAppointments, offlineAppointments};
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

    async isDoctorAvailable(doctor, requestedStartTime: Date, requestedEndTime: Date): Promise<boolean> {
    
    const availableStartTime = new Date(requestedStartTime);
    const availableEndTime = new Date(requestedEndTime);

    const doctorStartDateTime = new Date();
    doctorStartDateTime.setHours(parseInt(doctor.availableStartTime.split(':')[0]), parseInt(doctor.availableStartTime.split(':')[1]), 0, 0);

    const doctorEndDateTime = new Date();
    doctorEndDateTime.setHours(parseInt(doctor.availableEndTime.split(':')[0]), parseInt(doctor.availableEndTime.split(':')[1]), 0, 0);

    return availableStartTime >= doctorStartDateTime && availableEndTime <= doctorEndDateTime;
    }
    
    async isSlotAvailable(doctor: Doctor) {
        // Get current Indian time
        const indianTime = new Date();
        indianTime.setUTCHours(indianTime.getUTCHours() + 5); // Add 5 hours for Indian Standard Time
        indianTime.setUTCMinutes(indianTime.getUTCMinutes() + 30); // Add additional 30 minutes for Indian Standard Time
    
        // Calculate start and end of today in Indian time
        const startOfToday = new Date(indianTime);
        startOfToday.setUTCHours(0, 0, 0, 0); // Set to midnight
    
        const endOfToday = new Date(indianTime);
        endOfToday.setUTCHours(23, 59, 59, 999); // Set to end of the day
    
        // Fetch existing appointments for the doctor for today
        const existingAppointments = await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { doctorId: doctor.id },
                    { date: { gte: startOfToday, lt: endOfToday } }
                ]
            },
            orderBy: {
                date: 'desc'
            }
        });
    
        // Parse doctor's available start and end times to Indian time
        const [startHour, startMinute] = doctor.availableStartTime.split(':').map(Number);
        const [endHour, endMinute] = doctor.availableEndTime.split(':').map(Number);
    
        const doctorStartDateTime = new Date(indianTime);
        doctorStartDateTime.setUTCHours(startHour, startMinute, 0, 0); // Set doctor's start time in Indian time
    
        const doctorEndDateTime = new Date(indianTime);
        doctorEndDateTime.setUTCHours(endHour, endMinute, 0, 0); // Set doctor's end time in Indian time
    
        // If no appointments exist for today, return the doctor's start time
        if (existingAppointments.length === 0) {
            return doctorStartDateTime;
        }
    
        // Calculate end time of last appointment
        const lastAppointmentEndTime = new Date(existingAppointments[0].date);
        lastAppointmentEndTime.setMinutes(lastAppointmentEndTime.getMinutes() + 20); // Assuming appointments are 20 minutes long
    
        // If the last appointment ends before the doctor's end time, return its end time
        if (lastAppointmentEndTime <= doctorEndDateTime) {
            return lastAppointmentEndTime;
        }
    
        return null; // No available slot
    }

    private IndianTime(){
        const indianTime = new Date();
        indianTime.setUTCHours(indianTime.getUTCHours() + 5); // Add 5 hours for Indian Standard Time
        indianTime.setUTCMinutes(indianTime.getUTCMinutes() + 30); // Add additional 30 minutes for Indian Standard Time
    
        const startOfToday = new Date(indianTime);
        startOfToday.setUTCHours(0, 0, 0, 0);
    
        const endOfToday = new Date(indianTime);
        endOfToday.setUTCHours(23, 59, 59, 999);

        return {startOfToday, endOfToday};
    }
    
    
}
