import { Medication, PrescriptionType, PrescriptionStatus } from "@prisma/client";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateMedicationDto } from "./createMedication.dto";

export class CreatePrescriptionDto{

    @IsOptional()
    attachments: string[];

    @IsString()
    @IsOptional()
    instructionForOtherDoctor: string;

    @IsOptional()
    prescriptionType: PrescriptionType;

    @IsOptional()
    status: PrescriptionStatus;

    @IsArray()
    @IsOptional()
    medication: CreateMedicationDto[];
}