import { HospitalSpeciality } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { IsDecimal, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class HospitalSignupDto{
    @IsString()         
    @IsNotEmpty()
    name: string;

    @IsEmail()         
    @IsNotEmpty()
    email: string;

    @IsString()         
    @IsNotEmpty()
    @MinLength(8, { message: "Password must be atleast 8 characters long"})
    password: string;

    @IsString()         
    @IsNotEmpty()
    contactNumber: string;

    @IsString()         
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsOptional()
    speciality: HospitalSpeciality;

    @IsString()
    @IsOptional()
    hospitalDescription: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: Decimal;

    @IsNumber()
    @IsNotEmpty()
    longitude: Decimal;

}