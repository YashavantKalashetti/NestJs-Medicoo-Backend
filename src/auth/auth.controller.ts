import { Body, ClassSerializerInterceptor, Controller, HttpCode, HttpStatus, Post, Res, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';

@UseInterceptors(ClassSerializerInterceptor)  
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService){}

    @HttpCode(HttpStatus.OK)
    @Post('patient/signin')
    async patientSignin(@Res() res: Request, @Body() signinDto: SigninDto):Promise<{access_token: string}>{
        return this.authService.patientSignin(res,signinDto);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('patient/signup')
    async patientSignup(@Body() patientSignupDto: PatientSignupDto){
        patientSignupDto.dob = new Date(patientSignupDto.dob);
        return this.authService.patientSignup(patientSignupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('doctor/signin')
    async doctorSignin(@Res() res: Request,@Body() signinDto: SigninDto):Promise<{access_token: string}>{  
        return this.authService.doctorSignin(res,signinDto);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('doctor/signup')
    async doctorSignup(@Body() doctorSignupDto: DoctorSignupDto){
        doctorSignupDto.dob = new Date(doctorSignupDto.dob);
        return this.authService.doctorSignup(doctorSignupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('hospital/signin')
    async hospitalSignin(@Res() res: Request, @Body() signinDto: SigninDto):Promise<{access_token: string}>{
        return this.authService.hospitalSignin(res, signinDto);
    }   

    @HttpCode(HttpStatus.CREATED)
    @Post('hospital/signup')
    async hospitalSignup(@Body() hospitalSignupDto: HospitalSignupDto){
        return this.authService.hospitalSignup(hospitalSignupDto);
    }

}
