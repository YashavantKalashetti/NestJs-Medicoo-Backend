import { DoctorSpecialization, Gender } from "@prisma/client";
import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DoctorSignupDto{
    @IsString()         
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()         
    @IsNotEmpty()
    password: string;

    @IsString()         
    @IsNotEmpty()
    contactNumber: string;

    @IsString()         
    @IsNotEmpty()
    specialization: DoctorSpecialization;

    @IsString()         
    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    gender: Gender;

    @IsDateString()
    dob: Date;

    avatar?:string

    @IsNumber()
    @IsOptional()
    consultingFees: number;
}