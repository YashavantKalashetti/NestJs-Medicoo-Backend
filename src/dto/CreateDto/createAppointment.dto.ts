import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    doctorId: string;

    @IsDateString()
    @IsOptional()
    date: Date;

    @IsString()
    @IsNotEmpty()
    reason: string;
}