import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService, ROLES } from './auth.service';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, multerOptions } from 'src/Services';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './JwtStrategy';
import { Roles } from './customDecorator';
import { EmailInputDto } from 'src/dto/CreateDto/emailInput.dto';

@UseInterceptors(ClassSerializerInterceptor)  
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private cloudinaryService: CloudinaryService){}

    @Roles([ROLES.DOCTOR, ROLES.PATIENT, ROLES.HOSPITAL])
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('csrf-token')
    async getCsrfToken(@Req() req){
        return {csrfToken: req.csrfToken};
    }

    @HttpCode(HttpStatus.OK)
    @Post('patient/signin')
    async patientSignin(@Body() signinDto: SigninDto):Promise<{access_token: string}>{
        return this.authService.patientSignin(signinDto);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('patient/signup')
    async patientSignup(@Body() patientSignupDto: PatientSignupDto){
        return this.authService.patientSignup(patientSignupDto);
    }

    
    @Post('doctor/signin')
    async doctorSignin(@Body() signinDto: SigninDto):Promise<{access_token: string}>{  
        return this.authService.doctorSignin(signinDto);
    }

    // @HttpCode(HttpStatus.OK)
    // @Post('upload')
    
    // async postImage(@UploadedFile() file: Express.Multer.File, @Body() body: any){
    //     const filePath = file?.path;
    //     // console.log(user)
    //     if(filePath){

    //     }
    //     try {
    //         const uploadResponse = await this.cloudinaryService.uploadImage(filePath);
    //         return { success: true, data: uploadResponse.url };
    //     } catch (error) {
    //         return { success: false, error: error.message };
    //     }
    // }

    @HttpCode(HttpStatus.CREATED)
    @Post('doctor/signup')
    @UseInterceptors(FileInterceptor('avatar', multerOptions))
    async doctorSignup(@UploadedFile() file: Express.Multer.File, @Body() doctorSignupDto: DoctorSignupDto){
        const filePath = file?.path;
        if(filePath){
            const uploadResponse = await this.cloudinaryService.uploadImage(filePath);
            doctorSignupDto.avatar = uploadResponse.url;
        }
        return this.authService.doctorSignup(doctorSignupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('hospital/signin')
    async hospitalSignin(@Body() signinDto: SigninDto):Promise<{access_token: string}>{
        return this.authService.hospitalSignin(signinDto);
    }   

    @HttpCode(HttpStatus.CREATED)
    @Post('hospital/signup')
    async hospitalSignup(@Body() hospitalSignupDto: HospitalSignupDto){
        return this.authService.hospitalSignup(hospitalSignupDto);
    }

    @Get('otp')
    async getOtp(@Body('receiverEmail') receiverEmail: string){
        return this.authService.getOtp(receiverEmail);
    }

}
