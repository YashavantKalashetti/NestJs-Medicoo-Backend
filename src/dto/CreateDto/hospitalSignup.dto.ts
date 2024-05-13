import { HospitalSpeciality } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { IsDecimal, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class HospitalSignupDto{
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
    address: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: Decimal;

    @IsNumber()
    @IsNotEmpty()
    longitude: Decimal;

    @IsString()
    @IsOptional()
    speciality: HospitalSpeciality;
}