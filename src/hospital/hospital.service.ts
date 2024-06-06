import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppointmentMode, Hospital } from '@prisma/client';
import { CreateAppointmentDto, PatientSignupDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HospitalService {
    constructor(private prismaService: PrismaService) {}

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
                        totalAppointments:true,
                    }
                }
            }
        });

        delete hospital?.password;
        return hospital;
    }

    async getHospitalAppointments(hospitalId: string) {
        return this.prismaService.appointment.findMany({
            where: {
                hospitalId: hospitalId
            }
        });
    }

    // Doctor Services

    async getDoctors(hospitalId: string) {
        return this.prismaService.hospital.findUnique({
            where: {
                id: hospitalId
            },
            select: {
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
                        totalAppointments:true,
                    }
                }
            }
        });
    }

    async getDoctor(hospitalId: string, doctorId: string) {
        return this.prismaService.hospital.findUnique({
            where: {
                id: hospitalId
            },
            select: {
                registeredDoctors:{
                    where:{
                        id: doctorId
                    },select:{
                        id:true,
                        name:true,
                        email:true,
                        contactNumber:true,
                        specialization:true,
                        address:true,
                        rating:true,
                        avatar:true,
                    }
                }
            }
        });
    }

    async registerDoctorToHospital(hospitalId: string, doctorId: string) {
        if(!doctorId){
            throw new BadRequestException("Doctor Id is required");
        }
        const hospital = await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },data:{
                registeredDoctors:{
                    connect:{
                        id: doctorId
                    }
                }
            }
        });
        return {msg: "Registered Doctor to Hospital"};
    }

    async removeDoctorFromHospital(hospitalId: string, doctorId: string) {
        const hospital = await this.prismaService.hospital.update({
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

    async getDoctorAppointments(hospitalId: string, doctorId: string) {

        const {startOfToday, endOfToday} = this.IndianTime();
    
        const appointments= await this.prismaService.appointment.findMany({
            where: {
                AND: [
                    { doctorId},
                    { hospitalId},
                    { date: { gte: startOfToday, lt: endOfToday } },
                    {status: "NORMAL" || "EMERGENCY"}
                ]
            }
        });

        const offlineAppointments = appointments.filter(appointment => appointment.mode === AppointmentMode.OFFLINE);
        const onlineAppointments = appointments.filter(appointment => appointment.mode === AppointmentMode.ONLINE);

        return {offlineAppointments, onlineAppointments};
    }

    async divergeAppointments(hospitalId: string, oldDoctorId: string, newDoctorId: string) {
        const appointments = await this.prismaService.appointment.updateMany({
            where:{
                doctorId: oldDoctorId,
                hospitalId: hospitalId,
                mode: AppointmentMode.OFFLINE
            },
            data:{
                doctorId: newDoctorId
            }
        });

        return {msg: "Appointments Diverged"};
    }

    async  divergeSingleAppointment(hospitalId: string, oldDoctorId: string, newDoctorId: string , appointmentId: string) {
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
            }
        });

        return {patient: patient};
    }

    async registerPatientToHospital(hospitalId: string, body: {patientId: string}) {
        const {patientId} = body;
        const hospital = await this.prismaService.hospital.update({
            where:{
                id: hospitalId
            },data:{
                registeredPatients:{
                    connect:{
                        id: patientId
                    }
                }
            }
        });
        return {msg: "Registered Patient to Hospital"};
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
            
            const doctor = await this.prismaService.hospital.findUnique({
                where: {
                    id: hospitalId
                },
                select: {
                    registeredDoctors:{
                        where:{
                            id: appointmentDto.doctorId
                        }
                    }
                }
            });

            if(!doctor.registeredDoctors.length){
                throw new BadRequestException("Doctor not registered with hospital");
            }

            const patient = await this.prismaService.patient.findUnique({
                where: {
                    id: appointmentDto.patientId
                }
            });

            if(!patient){
                throw new BadRequestException("Patient not found");
            }
    
            const appointment = await this.prismaService.appointment.create({
                data: {
                    patientId: appointmentDto.patientId,
                    hospitalId: hospitalId,
                    ...appointmentDto,
                    mode: AppointmentMode.OFFLINE
                }
            });
    
            if(!appointment){
                throw new InternalServerErrorException("Appointment not created");
            }
    
            return appointment.id;
        
    }
    
    async appointmentCompleted(hospitalId: string, appointmentId: string) {
        const appointment = await this.prismaService.appointment.delete({
            where:{
                id: appointmentId,
                hospitalId: hospitalId
            }
        });

        return {msg: "Appointment Completed"};
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
