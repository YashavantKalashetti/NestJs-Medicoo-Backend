import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

import * as argon2 from "argon2";
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserEntity } from '../dto/UserEntity.dto';
import { DoctorSpecialization, HospitalSpeciality } from '@prisma/client';

export enum ROLES {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
    HOSPITAL = 'HOSPITAL'
};

@Injectable()
export class AuthService {

    constructor(private prismaService: PrismaService, private config: ConfigService, private jwt: JwtService){}

    async patientSignin(signinDto: SigninDto):Promise<{access_token: string}>{
        const { email, password} = signinDto;
        const user = await this.prismaService.patient.findUnique({
            where:{ email }
        })

        if(!user){
            throw new ForbiddenException('Incorrect credentials');
        }

        if(! argon2.verify(user.password, password)){
            throw new ForbiddenException('Incorrect credentials');
        }

        const { access_token } = await this.signToken(user.id, user.email, ROLES.PATIENT);

        // this.setCookie(res, access_token);
        return {access_token};
    }

    async patientSignup(patientSignupDto: PatientSignupDto){
        try {
            patientSignupDto.dob = new Date(patientSignupDto.dob);
            const hashedPassword = await argon2.hash(patientSignupDto.password);

            let patient_number = await this.generateUniqueId('PT');

            const user = await this.prismaService.patient.create({
                data:{
                    ...patientSignupDto,
                    patient_number,
                    password: hashedPassword,
                    contactNumber: patientSignupDto.contactNumber.toString(),
                    aadharNumber: patientSignupDto.aadharNumber.toString()
                }
            });

            if(!user) throw new ForbiddenException('User could not be created');

            await this.prismaService.medicalDetails.create({
                data:{
                    patientId: user.id,
                    bloodGroup: '', // default or initial value
                    height: 0, // default or initial value
                    weight: 0, // default or initial value
                    allergies: [], // default or initial value
                    medicalHistory: [], // default or initial value
                    systolic: 0, // default or initial value
                    diastolic: 0, // default or initial value
                }
            })

            const User = new UserEntity({...user});
            return user;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException("Credentials taken");
                }
            }
            // console.log(error.message)
            throw error;
        }
    }

    async doctorSignin(signinDto: SigninDto):Promise<{access_token: string}>{
        console.log("Doctor Signin");
        const { email, password} = signinDto;
        const user = await this.prismaService.doctor.findUnique({
            where:{ email }
        })

        if(!user){
            throw new ForbiddenException('Incorrect credentials');
        }

        if(! argon2.verify(user.password, password)){
            throw new ForbiddenException('Incorrect credentials');
        }

        const {access_token} = await this.signToken(user.id, user.email, ROLES.DOCTOR);
        // this.setCookie(res, access_token);
        return {access_token};
        
    }

    async doctorSignup(doctorSignupDto: DoctorSignupDto){
        
        try {

            const { specialization } = doctorSignupDto;

            if(specialization && !DoctorSpecialization[specialization]){
                throw new BadRequestException('Specialisation must be a valid value given in the enum');
            }

            doctorSignupDto.dob = new Date(doctorSignupDto.dob);
            doctorSignupDto.practicingSince = new Date(doctorSignupDto.practicingSince);
            const hashedPassword = await argon2.hash(doctorSignupDto.password);
            const doctor_number = await this.generateUniqueId('DR');
            const user = await this.prismaService.doctor.create({
                data:{
                    ...doctorSignupDto,
                    doctor_number,
                    password: hashedPassword,
                }
            });
            delete user.password;
            return user;

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException("Credentials taken");
                }
            }
            console.log(error.message)
            return  {msg: "Doctor could not be created" , error: error.message}
        }
    }   

    async hospitalSignin(signinDto: SigninDto):Promise<{access_token: string}>{
        const { email, password} = signinDto;
        const user = await this.prismaService.hospital.findUnique({
            where:{ email }
        })

        if(!user){
            throw new ForbiddenException('Incorrect credentials');
        }

        if(! argon2.verify(user.password, password)){
            throw new ForbiddenException('Incorrect credentials');
        }


        const { access_token } = await this.signToken(user.id, user.email, ROLES.HOSPITAL);

        // this.setCookie(res, access_token);
        return {access_token};
    }

    async hospitalSignup(hospitalSignupDto: HospitalSignupDto){
        try {
            const { speciality } = hospitalSignupDto;

            if(speciality && !HospitalSpeciality[speciality]){
                throw new BadRequestException('Speciality must be a valid value given in the enum');
            }

            const hashedPassword = await argon2.hash(hospitalSignupDto.password);
            const hospital_number = await this.generateUniqueId('HS');
            const hospital = await this.prismaService.hospital.create({
                data:{
                    ...hospitalSignupDto,
                    hospital_number,
                    password: hashedPassword,
                    latitude: Number(hospitalSignupDto.latitude),
                    longitude: Number(hospitalSignupDto.longitude),
                }
            });
            delete hospital.password;
            return hospital;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException("Credentials taken");
                }
            }
            console.log(error.message)
            throw error;
        }
    }

    // Helpers

    async signToken(userId: string, email: string, role:ROLES):Promise<{access_token: string}> {
        // console.log(role)
        const payload = {
            sub: userId,
            role,
            email
        }

        const access_token:string = await this.jwt.signAsync(payload,{
            expiresIn: '5d',
            secret: this.config.get('JWT_SECRET')
        })

        return {access_token};
    }

    async setCookie(res: any, token: string){
        await res.cookie('access_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
    }

    async generateUniqueId(prefix) {
        // Ensure the prefix is a two-letter string
        if (typeof prefix !== 'string' || prefix.length !== 2) {
            throw new Error('Prefix must be a two-letter string');
        }
    
        const randomNumber = Math.floor(Math.random() * 9000000) + 1000000;
        let uniqueId = `${prefix}${randomNumber}`.toString();

        let isUnique = false;

        while (!isUnique) {

            if (prefix === 'PT') {
                const patient = await this.prismaService.patient.findUnique({
                    where: { patient_number: uniqueId }
                });
                if(!patient)
                    isUnique = true;
            } else if (prefix === 'DR') {
                const doctor = await this.prismaService.doctor.findUnique({
                    where: { doctor_number: uniqueId }
                });
                console.log(doctor)
                if(!doctor)
                    isUnique = true;
            } else if (prefix === 'HS') {
                const hospital = await this.prismaService.hospital.findUnique({
                    where: { hospital_number: uniqueId }
                });
                if(!hospital)
                    isUnique = true;
            } else {
                throw new Error('Invalid prefix');
            }
    
            if (!isUnique) {
                const newRandomNumber = Math.floor(Math.random() * 9000000) + 1000000;
                uniqueId = `${prefix}${newRandomNumber}`.toString();
            }
            console.log('Unique ID:', uniqueId);
        }
    
        return uniqueId;
    }

}
