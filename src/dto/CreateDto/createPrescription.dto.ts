import { Medication, MedicationType, PrescriptionStatus } from "@prisma/client";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateMedicationDto } from "./createMedication.dto";

export class CreatePrescriptionDto{

    @IsOptional()
    attachments: string[];

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