import { Appointment, AppointmentMode, AppointmentStatus } from "@prisma/client";
import { IsDate, IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { App } from "supertest/types";

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    doctorId: string;

    @IsString()
    @IsOptional()
    patientId: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsNotEmpty()
    slotTime: string;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsString()
    @IsOptional()
    status: AppointmentStatus;

    @IsString()
    @IsOptional()
    mode: AppointmentMode;
}