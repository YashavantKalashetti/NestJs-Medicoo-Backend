import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Appointment, AppointmentStatus, Doctor, MedicationStatus, Patient, Prescription, PrescriptionStatus, Prisma } from '@prisma/client';
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
            },
        });

        if(!patient){
            throw new NotFoundException("Not found");
        }

        const appointments = await this.prismaService.appointment.findMany({
            where: {
                patientId: userId,
            },
            select: {
                id:true,
                date: true,
                reason: true,
                mode: true,
            },
            orderBy: {
                date: 'desc'
            },
            take: 5
        });

        const prescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId
            },
            include: {
                medications: {
                    select: {
                        medicine: true,
                        dosage: true,
                        instruction: true,
                        validTill: true,
                        prescriptionId: true,
                        numberOfDays: true,
                        numberOfTimes: true,
                    }
                }
            },
            take: 5
        });

        const medications = prescriptions.map(prescription => prescription.medications).flat();

        prescriptions.map(prescription => delete prescription.medications);

        const medicalDetails = await this.prismaService.medicalDetails.findFirst({
            where: {
                patientId: userId
            }
        });

        const reports = await this.getPatientReports(userId , "");

        delete patient.password;

        return {patient, appointments, prescriptions, medications, medicalDetails, reports};
    }

    async getPrescriptions(userId: string){  
        const prescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId,
                status: PrescriptionStatus.ACTIVE
            },
            include:{
                medications: true
            },
            orderBy:{
                createdAt: 'desc'
            }
        });

        const importantPrescriptions = prescriptions.filter(prescription => prescription.prescriptionType === "IMPORTANT");
        const normalPrescriptions = prescriptions.filter(prescription => prescription.prescriptionType === "NORMAL");

        return {importantPrescriptions, normalPrescriptions};
    }

    async getPrescriptionById(userId: string, prescriptionId: string){
        const prescription = await this.prismaService.prescription.findFirst({
            where: {
                id: prescriptionId,
                patientId: userId,
            },
            include:{
                medications: true
            }
        });

        if(!prescription){
            throw new BadRequestException("Prescription not found");
        }

        return {prescription};
    }

    async updatePrescriptionDisplayStatus(userId: string, prescriptionId: string, status: boolean){
        const updatedPrescription = await this.prismaService.prescription.update({
            where: {
                id: prescriptionId,
                patientId: userId
            },
            data: {
                displayable: status
            }
        });

        if(!updatedPrescription){
            throw new BadRequestException("Prescription not found");
        }

        return {msg: "Prescription status updated successfully"};
    }

    async getAllCurrentMedications(userId: string){
        const prescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId,
                status: PrescriptionStatus.ACTIVE
            },
            select:{
                medications: true
            }
        });

        return await this.ismedicationValid(prescriptions);
    }

    async getPatientReports(patientId: string, search: string){
        search = search?.trim();
        if(search == "" || search == null){

            const attachments = await this.prismaService.prescriptionAttachementElasticSearch.findMany({
                where:{
                    patientId,
                }
            });

            const urls = attachments.map(attachment => attachment.url);

            return {urls};

        }

        const response = await fetch(`${this.config.get('MICROSERVICE_SERVER')}/elasticSearch/med-reports`, {
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

        return {urls};
    }

    async bookAppointment(userId: string, appointmentDto: CreateAppointmentDto, status?: AppointmentStatus) {
        
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                id: appointmentDto.doctorId
            },
            select: {
                id: true,
                name: true,
                availableStartTime: true,
                availableEndTime: true,
            }
        });

        const appointmentTime = new Date(appointmentDto.date);
        const [hour, minute] = appointmentDto.slotTime.split(':').map(Number);
        appointmentTime.setHours(hour, minute, 0, 0);

        // check if the given time is in doctor available time
        const isTimeSlotValid = await this.isDoctorAvailableDuringGivenTimeSlot(doctor, appointmentTime);

        if (!isTimeSlotValid) {
            throw new BadRequestException('Doctor is not available during the given time slot');
        }

        if (!doctor) {
            throw new BadRequestException('Doctor not found');
        }
    
        const isSlotBooked = await this.isSlotBooked(appointmentDto.doctorId, appointmentTime);
    
        if (isSlotBooked.avilability) {
            throw new BadRequestException('Slot is already booked');
        }
    
    
        const appointment = await this.prismaService.appointment.create({
            data: {
                doctorId: appointmentDto.doctorId,
                patientId: userId,
                date: appointmentTime,
                reason: appointmentDto.reason,
            },
        });
    
        return { appointment };
    }

    private async isSlotBooked(doctorId: string, appointmentTime){

        const currentTime = new Date();
        
        if(currentTime > appointmentTime){
            throw new BadRequestException("You cannot book previous day appointments")
        }
    
        const appointment = await this.prismaService.appointment.findFirst({
          where: {
            doctorId,
            date: new Date(appointmentTime),
          },
        });

        return {avilability : appointment !== null};
        
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

    async reviewAppointment(userId: string, appointmentId: string, appointmentDto: CreateAppointmentDto, rating: number){

        const appointment = await this.prismaService.appointment.findFirst({
            where: {
                AND: [
                    { id: appointmentId},
                    { patientId: userId },
                    { doctorId: appointmentDto.doctorId }
                ]
            }
        });

        if(!appointment){
            throw new BadRequestException("Appointment not found");
        }

        await this.prismaService.appointment.update({
            where: {
                id: appointment.id
            },
            data:{
                status: "COMPLETED"
            }
        });

        if(!rating){
            return {msg: "Rating could not be Submitted."} ;
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

        return { msg : "Doctor reviewed successfully" };
    }

    async inactivePrescriptions(userId: string){
        const inactivePrescriptions = await this.prismaService.prescription.findMany({
            where: {
                patientId: userId,
                status: PrescriptionStatus.INACTIVE
            },
            include:{
                medications: true,
                doctor: true
            }
        });

        return {inactivePrescriptions};
    }

    async deletePrescription(userId: string, id: string){
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

        return { msg: "Prescription deleted successfully" };
    }

    async updateParent(userId: string,patient_number: string){
        try {
            if (!patient_number) {
                throw new Error('Parent ID is required');
            }
    
            // Check if the parent exists
            const parentExists = await this.prismaService.patient.findUnique({
            where: { patient_number },
            });
    
            if (!parentExists) {
            throw new Error('Parent not found');
            }
    
            // Update the patient with the parentId
            const patient = await this.prismaService.patient.update({
            where: { id: userId },
            data: {
                patient_number,
            },
            });
    
            return {msg: 'Parent Access updated successfully'};
        } catch (error) {
            console.error(error);
            throw new ForbiddenException('Failed to update parent');
        }
    }

    async getChildrens(userId: string){
        const children = await this.prismaService.patient.findMany({
            where: {
                parentId: userId
            },
            select:{
                id: true,
                name: true,
                email: true,
                dob: true,
                aadharNumber: true,
                gender: true,
            }
        });

        return children;
    }

    async getChildDetails(userId: string, patientId: string){
            
        const children = await this.prismaService.patient.findUnique({
            where: {
                id: patientId,
                parentId: userId
            },select:{
                id: true,
                name: true,
                email: true,
                dob: true,
                aadharNumber: true,
                contactNumber: true,
                prescriptions: {
                    select:{
                        id: true,
                        status: true,
                        prescriptionType: true,
                        medications: {
                            select:{
                                medicine: true,
                                dosage: true,
                                instruction: true,
                                validTill: true,
                            }
                        }
                    }
                },
                medicalDetails:{
                    select:{
                        bloodGroup: true,
                        height: true,
                        weight: true,
                        allergies: true,
                        medicalHistory: true,
                        systolic: true,
                        diastolic: true,
                    }
                }
            }
        });

        if(!children){
            throw new NotFoundException("Child with your access not found");
        }
    
        return {children};
    }

    async getChildEmergencyAppointments(userId: string, patientId: string){
        const {startOfToday, endOfToday} = this.IndianTime();
    
        await this.getChildDetails(userId, patientId);

        const existingAppointments = await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { patientId: patientId},
                    { status: "EMERGENCY" },
                ]
            },
            orderBy: {
                date: 'desc'
            },
            include:{
                doctor: true,
                hospital: true
            },
            take: 3
        });

        return existingAppointments;
    }

    async updatePrimaryDoctorAccess(userId: string, body: any){
        const doctor = await this.prismaService.doctor.findUnique({
            where: {
                doctor_number: body.doctor_number
            }
        });

        if(!doctor){
            throw new NotFoundException("Doctor not found");
        }
        
        if(body.access == "GRANT"){
            await this.prismaService.patient.update({
                where: {
                    id: userId
                },
                data: {
                    primaryDoctors: {
                        connect: {
                            id: doctor.id
                        }
                    }
                }
            });
        }else if(body.access == "REVOKE"){
            await this.prismaService.patient.update({
                where: {
                    id: userId
                },
                data: {
                    primaryDoctors: {
                        disconnect: {
                            id: doctor.id
                        }
                    }
                }
            });
        }else{
            throw new BadRequestException("Invalid access type");
        }


        return {msg: "Primary Doctor updated successfully"};

    }


    // Helpers

    private async ismedicationValid(prescriptions){
        const validMediations = [];
        const expiredMedications = [];

        prescriptions.forEach(async prescription => {
            prescription.medications.forEach(async medication => {
                if(medication.status === MedicationStatus.VALID){
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);
                    let validTillDate = new Date(medication.validTill);
                    validTillDate.setHours(0, 0, 0, 0);

                    if (validTillDate >= today) {
                        const timeDiff = validTillDate.getTime() - today.getTime();
                        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days

                        medication.daysRemaining = daysRemaining;

                        validMediations.push(medication);
                    }else{
                        await this.prismaService.medication.update({
                            where: {
                                id: medication.id
                            },
                            data: {
                                status: MedicationStatus.EXPIRED
                            }
                        });
                        expiredMedications.push(medication);
                    }
                }else{
                    expiredMedications.push(medication);
                }

            });
        });

        return {validMediations, expiredMedications};
    }

    private isDoctorAvailableDuringGivenTimeSlot(doctor, requestedStartTime: Date): boolean{

        const doctorStartDateTime = new Date();
        doctorStartDateTime.setHours(parseInt(doctor.availableStartTime.split(':')[0]), parseInt(doctor.availableStartTime.split(':')[1]), 0, 0);

        const doctorEndDateTime = new Date();
        doctorEndDateTime.setHours(parseInt(doctor.availableEndTime.split(':')[0]), parseInt(doctor.availableEndTime.split(':')[1]), 0, 0);


        // console.log(doctorStartDateTime)
        // console.log(doctorEndDateTime)
        // console.log(requestedStartTime)

        return requestedStartTime >= doctorStartDateTime && requestedStartTime <= doctorEndDateTime;

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
