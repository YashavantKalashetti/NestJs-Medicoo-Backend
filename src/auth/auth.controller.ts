import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService, ROLES } from './auth.service';
import { SigninDto, PatientSignupDto, DoctorSignupDto, HospitalSignupDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, multerOptions } from 'src/Services';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './JwtStrategy';
import { Roles } from './customDecorator';
import { EmailInputDto } from 'src/dto/CreateDto/emailInput.dto';
import { request, Response } from 'express';

@UseInterceptors(ClassSerializerInterceptor)  
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private cloudinaryService: CloudinaryService){}

    @Get('/')
    handleRequest(@Req() request: Request, @Res() res: Response, @Query() query: any) {
      console.log('Request Body:', query);
  
      res.cookie('exampleCookie', 'cookieValue', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
      });

      throw new UnauthorizedException('This is a test error');

      return "hello";
  
    //   res.status(200).send({ message: 'Cookie has been set' });
    }

    @Roles([ROLES.DOCTOR, ROLES.PATIENT, ROLES.HOSPITAL])
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('csrf-token')
    async getCsrfToken(@Req() req){
        return {csrfToken: req.csrfToken};
    }

    @HttpCode(HttpStatus.OK)
    @Post('patient/signin')
    async patientSignin(@Res() res: Response, @Body() signinDto: SigninDto){
        const {access_token, role, userId} = await this.authService.patientSignin(signinDto);
        res.cookie('medico_access_token', access_token, {httpOnly: true, secure: true, maxAge: 3600000});
        res.status(HttpStatus.OK).json({access_token, role, userId});
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('patient/signup')
    async patientSignup(@Body() patientSignupDto: PatientSignupDto){
        return this.authService.patientSignup(patientSignupDto);
    }
    
    @Post('doctor/signin')
    async doctorSignin(@Res() res: Response, @Body() signinDto: SigninDto){  
        const {access_token, role, userId} = await this.authService.doctorSignin(signinDto);
        res.cookie('medico_access_token', access_token, {httpOnly: true, secure: true, maxAge: 3600000});
        res.status(HttpStatus.OK).json({access_token, role, userId});
    }

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
    async hospitalSignin(@Res() res: Response, @Body() signinDto: SigninDto){
        const {access_token, role, userId} = await this.authService.hospitalSignin(signinDto);
        res.cookie('med_access_token', access_token, {httpOnly: true, secure: true, maxAge: 3600000});
        res.status(HttpStatus.OK).json({access_token, role, userId});
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
