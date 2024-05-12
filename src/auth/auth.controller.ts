import { Body, ClassSerializerInterceptor, Controller, HttpCode, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, multerOptions } from 'src/Services';
import { GetUser } from './customDecorator';

@UseInterceptors(ClassSerializerInterceptor)  
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private cloudinaryService: CloudinaryService){}

    @HttpCode(HttpStatus.OK)
    @Post('patient/signin')
    async patientSignin(@Body() signinDto: SigninDto):Promise<{access_token: string}>{
        return this.authService.patientSignin(signinDto);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('patient/signup')
    async patientSignup(@Body() patientSignupDto: PatientSignupDto){
        patientSignupDto.dob = new Date(patientSignupDto.dob);
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
        doctorSignupDto.dob = new Date(doctorSignupDto.dob);
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

}
