import { OmitType, PartialType } from '@nestjs/mapped-types';
import { PatientSignupDto } from '../CreateDto/patientSignup.dto';

export class PatientUpdateDto extends PartialType(OmitType(PatientSignupDto, ['aadharNumber'] as const)) {}
