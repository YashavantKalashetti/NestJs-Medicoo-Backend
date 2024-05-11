import { PartialType } from "@nestjs/mapped-types";
import { HospitalSignupDto } from "../CreateDto/hospitalSignup.dto";

export class HospitalUpdateDto extends PartialType(HospitalSignupDto){}