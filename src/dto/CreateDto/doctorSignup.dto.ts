import { DoctorSpecialization, Gender } from "@prisma/client";
import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class DoctorSignupDto{
    @IsString()         
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()         
    @IsNotEmpty()
    @MinLength(8, { message: "Password must be atleast 8 characters long" })
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

    @IsDateString()
    practicingSince: Date;

    @IsString()
    @IsOptional()
    education?: string

    avatar?:string

    @IsNumber()
    @IsOptional()
    consultingFees: number;

    languages: string[];

}