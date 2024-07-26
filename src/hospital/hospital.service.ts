import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentMode, AppointmentStatus, DoctorSpecialization, Hospital } from '@prisma/client';
import { CreateAppointmentDto, PatientSignupDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HospitalService {
    constructor(private prismaService: PrismaService, private configService: ConfigService) {}

    async getMyHospitalDetails(hospitalId: string){
        const hospital = await this.prismaService.hospital.findUnique({
            where:{
                id: hospitalId
            },
            include:{
                registeredDoctors:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        address:true,
                        rating:true,
                        avatar:true,
                    }
                },
                registeredPatients:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        address:true,
                    }
                },
            }
        });

        const todayAppointment = await this.prismaService.appointment.findMany({
            where:{
                hospitalId: hospitalId,
                date: new Date()
            }
        });

        const previousAppointments = await this.prismaService.appointment.findMany({
            where:{
                hospitalId: hospitalId,
                date: {
                    lt: new Date()
                }
            }
        });
        
        const registeredDoctors = hospital.registeredDoctors;

        const patientsCount = hospital.registeredPatients.length;

        const emergencyAppointments = await this.getEmergencyAppointments(hospitalId);

        delete hospital?.password;

        return { hospital, todayAppointment, previousAppointments , registeredDoctors, patientsCount, emergencyAppointments};
    }

    async getHospitalAppointments(hospitalId: string, status?: AppointmentStatus) {

        if(status && status !== "NORMAL" && status !== "EMERGENCY"){
            status = undefined;
        }

        return this.prismaService.appointment.findMany({
            where: {
                hospitalId: hospitalId,
                status: status
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true,
                        address: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true,
                        specialization: true,
                    }
                }
            }
        });
    }

    async getEmergencyAppointments(hospitalId: string) {
    
        return this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { hospitalId },
                    {status: "EMERGENCY"}
                ]
            },
            include:{
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true,
                        address: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true,
                        specialization: true,
                    }
                }
            }
            
        });
    }
    

    // Doctor Services

    async getDoctors(hospitalId: string, specialization?: DoctorSpecialization) {
        return this.prismaService.doctor.findMany({
            where: {
                affiliatedHospitals: {
                    some: {
                        id: hospitalId,
                    }
                },
                specialization: specialization
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
                specialization: true,
                rating: true,
                avatar: true,
            }
        });
    }

    async getDoctor(hospitalId: string, doctorId: string) {
        const doctor = await  this.prismaService.doctor.findUnique({
            where: {
                id: doctorId,
                affiliatedHospitals:{
                    some:{
                        id: hospitalId
                    }
                }
            },
            select:{
                id:true,
                name:true,
                email:true,
                contactNumber:true,
                specialization:true,
                rating:true,
                avatar:true,
                appointments : {
                    where:{
                        hospitalId: hospitalId
                    }
                }
            },
            
        });

        if(!doctor){
            throw new NotFoundException("Doctor not registered with hospital");
        }

        return {doctor};
    }

    async registerDoctorToHospital(hospitalId: string, doctor_number: string) {

        if(!doctor_number){
            throw new BadRequestException("Doctor Id is required");
        }

        const doctor = await this.prismaService.doctor.findUnique({
            where:{
                doctor_number
            },
            select:{
                id:true,
                affiliatedHospitals:true
            }
        })

        if(!doctor){
            throw new NotFoundException("Doctor not found");
        }

        if(doctor.affiliatedHospitals.some(hospital => hospital.id === hospitalId)){
            throw new BadRequestException("Doctor already registered with hospital");
        }

        await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },data:{
                registeredDoctors:{
                    connect:{
                        id: doctor.id
                    }
                }
            }
        });

        return {msg: "Registered Doctor to Hospital"};
    }

    async removeDoctorFromHospital(hospitalId: string, doctorId: string, divergeDoctorId?: string) {

        await this.getDoctor(hospitalId, doctorId);

        const {offlineAppointments, onlineAppointments} = await this.getDoctorAppointments(hospitalId, doctorId);

        if( offlineAppointments.length > 0 && onlineAppointments.length > 0 && !divergeDoctorId){
            throw new BadRequestException("Diverge Doctor Id is required as there are some appointments pending for this doctor");
        }

        await this.divergeAppointments(hospitalId, doctorId, divergeDoctorId);
        
        await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },data:{
                registeredDoctors:{
                    disconnect:{
                        id: doctorId
                    }
                }
            }
        });
        
        return {msg: "Doctor Regstration removes from Hospital"};
    }

    async setDoctorAvailableInHospital(hospitalId: string, doctorId: string) {

        await this.getDoctor(hospitalId, doctorId);

        const doctor = await this.prismaService.doctor.update({
            where:{
                id: doctorId,
                affiliatedHospitals :{
                    some:{
                        id: hospitalId
                    }
                }
            },
            data:{
                attendingHospitalId: hospitalId
            }
        });

        if(!doctor){
            throw new BadRequestException("Doctor not found");
        }

        return {msg: "Doctor Punched In"};
    }

    async setDoctorUnAvailableInHospital(hospitalId: string, doctorId: string) {

        await this.getDoctor(hospitalId, doctorId);

        const doctor = await this.prismaService.doctor.update({
            where:{
                id: doctorId,
                affiliatedHospitals:{
                    some:{
                        id: hospitalId
                    }
                }
            },
            data:{
                attendingHospitalId: null
            }
        });

        if(!doctor){
            throw new BadRequestException("Doctor not found");
        }
    
        return { msg: "Doctor Punched Out" };
    }

    async getDoctorAppointments(hospitalId: string, doctorId: string) {

        const {startOfToday, endOfToday} = this.IndianTime();
    
        const appointments= await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { doctorId},
                    { hospitalId},
                    { date: { gte: startOfToday, lt: endOfToday } },
                ]
            }
        });

        const offlineAppointments = appointments.filter(appointment => appointment.mode === AppointmentMode.OFFLINE);
        const onlineAppointments = appointments.filter(appointment => appointment.mode === AppointmentMode.ONLINE);

        return {offlineAppointments, onlineAppointments};
    }

    async divergeAppointments(hospitalId: string, oldDoctorId: string, newDoctorId: string) {

        await this.getDoctor(hospitalId, oldDoctorId);
        await this.getDoctor(hospitalId, newDoctorId);

        const appointments = await this.prismaService.appointment.updateMany({
            where:{
                doctorId: oldDoctorId,
                hospitalId: hospitalId,
            },
            data:{
                doctorId: newDoctorId
            }
        });

        if(!appointments){
            throw new BadRequestException("No appointments to diverge");
        }

        return {msg: "Appointments Diverged"};
    }

    async  divergeSingleAppointment(hospitalId: string, oldDoctorId: string, newDoctorId: string , appointmentId: string) {

        // Confirming whether doctors are registered with hospital
        await this.getDoctor(hospitalId, oldDoctorId);
        await this.getDoctor(hospitalId, newDoctorId);

        const appointment = await this.prismaService.appointment.update({
            where:{
                id: appointmentId,
                hospitalId: hospitalId,
                doctorId: oldDoctorId,
                mode: AppointmentMode.OFFLINE
            },data:{
                doctorId: newDoctorId
            }
        });

        if(!appointment){
            throw new BadRequestException("Appointment not found");
        }
        
        return {msg: "Appointment Diverged"};
    }

    // Patient Services
    async getPatients(hospitalId: string) {
        return this.prismaService.hospital.findUnique({
            where: {
                id: hospitalId
            },
            select: {
                registeredPatients:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        address:true,
                    }
                }
            }
        }); 
    }

    async getPatient(hospitalId: string, patientId: string) {
        const patient = await  this.prismaService.patient.findUnique({
            where: {
                id: patientId,
                hospitalsRegistered:{
                    some:{
                        id: hospitalId
                    }
                }
            },select:{
                id:true,
                name:true,
                email:true,
                contactNumber:true,
                address:true,
                appointments:{
                    where:{
                        hospitalId: hospitalId
                    }
                }
            }
        });

        if(!patient){
            throw new NotFoundException("Not Found");
        }

        return {patient};
    }

    async registerPatientToHospital(hospitalId: string, patient_number: string) {

        const patient = await this.prismaService.patient.findFirst({
            where:{
                patient_number
            }
        }); 

        if(!patient){
            throw new NotFoundException("Patient not found");
        }

        await this.prismaService.patient.update({
            where:{
                patient_number
            },
            data:{
                hospitalsRegistered:{
                    connect:{
                        id: hospitalId
                    }
                }
            }
        });


        return { msg: "Registered Patient to Hospital" };
    }

    async getPatientAppointmentsInHospital(hospitalId: string, patientId: string) {
        const appointments = await this.prismaService.appointment.findMany({
            where: {
                patientId: patientId,
                hospitalId: hospitalId
            }
        });

        return {appointments: appointments};
    }

    async bookAppointment(hospitalId: string, appointmentDto: CreateAppointmentDto) {
            
        // Confirming ehether doctor is registered with hospital
        await this.getDoctor(hospitalId, appointmentDto.doctorId);

        const patient = await this.prismaService.patient.findUnique({
            where: {
                id: appointmentDto.patientId,
                hospitalsRegistered:{
                    some:{
                        id: hospitalId
                    }
                }
            }
        });

        if(!patient){
            // Registering patient to hospital if not registered previously
            await this.registerPatientToHospital(hospitalId, appointmentDto.patientId);
        }

        const appointment = await this.prismaService.appointment.create({
            data: {
                patientId: appointmentDto.patientId,
                hospitalId: hospitalId,
                ...appointmentDto,
                date: new Date(appointmentDto.date),
                mode: AppointmentMode.OFFLINE
            }
        });

        if(!appointment){
            throw new InternalServerErrorException("Appointment not created");
        }

        return appointment.id;
        
    }
    
    async appointmentCompleted(hospitalId: string, appointmentId: string) {
        await this.prismaService.appointment.delete({
            where:{
                id: appointmentId,
                hospitalId: hospitalId
            }
        });

        return {msg: "Appointment Completed"};
    }

    // Emergency Appointments Services

    async getDoctorsForEmergency(hospitalId: string, specialization: DoctorSpecialization) {
        const doctors = await  this.prismaService.doctor.findMany({
            where: {
                affiliatedHospitals: {
                    some: {
                        id: hospitalId
                    }
                },
                specialization: specialization,
                attendingHospitalId: hospitalId
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
                specialization: true,
                avatar: true,
            }
        });

        return { doctors };
    }

    async undertakePatientEmergencyAppointment(hospitalId: string, patient_number: string) {
        const patient = await this.prismaService.patient.findUnique({
            where:{
                patient_number
            }
        });


        if(!patient){
            throw new NotFoundException("Patient not found");
        }

    

        const appointment = await this.prismaService.appointment.findFirst({
            where:{
                patientId: patient.id,
                hospitalId: null,
                doctorId: null,
                status: "EMERGENCY"
            }
        });


        if(!appointment || appointment.doctorId || appointment.hospitalId){
            throw new NotFoundException("Appointment has been already Undertaken");
        }


        await this.prismaService.appointment.update({
            where:{
                id: appointment.id
            },
            data:{
                hospitalId
            }
        });

        return {msg: "Appointment Undertaken Successfully"};
    }

    async setHospitalAvailability(hospitalId: string, available: boolean) {
        const hospital = await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },
            data:{
                availableForConsult: available
            }
        });

        // console.log(hospital);

        await this.updateHositalAvailabilityStatusGlobally(hospitalId, hospital);

        return {msg: "Hospital Availability Updated"};
    }

    // Helpers

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

    async updateHositalAvailabilityStatusGlobally(hospitalId: string, hospital) {

        try {
            const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER_URL')}/medData/hospitals/${hospitalId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ availableForConsult: hospital.availableForConsult }),
            });
    
            if(!response.ok){
                throw new InternalServerErrorException("Hospital Availability Status not updated globally");
            }
        } catch (error) {
            return { msg: "Hospital Availability Status not updated globally" };
        }

        return {msg: "Hospital Availability Status Updated Globally"};
    }

}
