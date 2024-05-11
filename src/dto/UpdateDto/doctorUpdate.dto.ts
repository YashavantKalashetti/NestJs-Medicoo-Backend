import { PartialType } from "@nestjs/mapped-types";
import { DoctorSignupDto } from "../CreateDto/doctorSignup.dto";

export class DoctorUpdateDto extends PartialType(DoctorSignupDto){}