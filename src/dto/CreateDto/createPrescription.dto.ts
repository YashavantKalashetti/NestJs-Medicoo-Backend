import { Medication, MedicationType, PrescriptionStatus } from "@prisma/client";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateMedicationDto } from "./createMedication.dto";

export class CreatePrescriptionDto{

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    attachment: string;

    @IsString()
    @IsOptional()
    instructionForOtherDoctor: string;

    @IsOptional()
    medicationType: MedicationType;

    @IsOptional()
    status: PrescriptionStatus;

    @IsArray()
    @IsOptional()
    medication: CreateMedicationDto[];
}