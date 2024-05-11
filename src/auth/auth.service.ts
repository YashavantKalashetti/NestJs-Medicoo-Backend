import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

import * as argon2 from "argon2";
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserEntity } from '../dto/UserEntity.dto';

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

        return this.signToken(user.id, user.email, ROLES.PATIENT);
    }

    async patientSignup(patientSignupDto: PatientSignupDto){
        try {
            const hashedPassword = await argon2.hash(patientSignupDto.password);
            const user = await this.prismaService.patient.create({
                data:{
                    ...patientSignupDto,
                    password: hashedPassword,
                    contactNumber: patientSignupDto.contactNumber.toString(),
                    aadharNumber: patientSignupDto.aadharNumber.toString()
                }
            });
            const User = new UserEntity({...user});
            return user;
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

    async doctorSignin(signinDto: SigninDto):Promise<{access_token: string}>{
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

        return this.signToken(user.id, user.email, ROLES.DOCTOR);
    }

    async doctorSignup(doctorSignupDto: DoctorSignupDto){
        try {

            const affiliatedHospital = doctorSignupDto.affiliatedHospitalId;

            if(affiliatedHospital){
                const hospital = await this.prismaService.hospital.findUnique({
                    where:{ id: affiliatedHospital }
                });
    
                if(!hospital){
                    throw new ForbiddenException("Hospital not found. You have added a wrong hospital id. Please check and try again.");
                }
            }

            const hashedPassword = await argon2.hash(doctorSignupDto.password);
            const user = await this.prismaService.doctor.create({
                data:{
                    ...doctorSignupDto,
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
            throw error;
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

        return this.signToken(user.id, user.email, ROLES.HOSPITAL);
    }

    async hospitalSignup(hospitalSignupDto: HospitalSignupDto){
        try {
            const hashedPassword = await argon2.hash(hospitalSignupDto.password);
            const hospital = await this.prismaService.hospital.create({
                data:{
                    ...hospitalSignupDto,
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

    async signToken(userId: string, email: string, role:ROLES):Promise<{access_token: string}> {
        // console.log(role)
        const payload = {
            sub: userId,
            role,
            email
        }

        const access_token:string = await this.jwt.signAsync(payload,{
            expiresIn: '60m',
            secret: this.config.get('JWT_SECRET')
        })

        return {access_token};
    }


}
