import { Appointment, AppointmentMode, AppointmentStatus } from "@prisma/client";
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { App } from "supertest/types";

export class EmailInputDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    message: string;

    @IsString()
    @IsNotEmpty()
    subject: string;
}