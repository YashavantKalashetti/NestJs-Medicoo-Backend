import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMedicationDto{

    @IsString()
    @IsOptional()
    medicine: string;

    @IsString()
    @IsOptional()
    dosage: string;

    @IsString()
    @IsOptional()
    instruction: string;

    @IsNumber()
    @IsOptional()
    numberOfDays: number;
}