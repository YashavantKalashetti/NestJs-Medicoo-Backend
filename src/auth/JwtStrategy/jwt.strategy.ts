import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../../src/prisma/prisma.service";
import { ROLES } from "../auth.service";

@Injectable()
export class JwtStratergy extends PassportStrategy(Strategy, 'jwt'){
    constructor(config: ConfigService,private prisma: PrismaService){
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['access_token'];
                    }
                    return token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            secretOrKey: config.get('JWT_SECRET')
        });
    }

    async validate(payload: {sub: string, email: string, role: string}){
        // console.log("Verifying jwt")
        let user;
        const { role } = payload;

        if(role === ROLES.PATIENT){ 
            user = await this.prisma.patient.findUnique({
                where:{ id: payload.sub }
            });
            if(!user){
                throw new HttpException('You are not Authorized User', HttpStatus.UNAUTHORIZED);
            }
            delete user.password;
            user.role = ROLES.PATIENT;
            return user;
        }else if(role === ROLES.DOCTOR){
            user = await this.prisma.doctor.findUnique({
                where:{ id: payload.sub }
            });
            if(!user){
                throw new HttpException('You are not Authorized User', HttpStatus.UNAUTHORIZED);
            }
            delete user.password;
            user.role = ROLES.DOCTOR;
            return user;
        }else if(role === ROLES.HOSPITAL){
            user = await this.prisma.hospital.findUnique({
                where:{ id: payload.sub }
            });
            if(!user){
                throw new HttpException('You are not Authorized User', HttpStatus.UNAUTHORIZED);
            }
            delete user.password;
            user.role = ROLES.HOSPITAL;
            return user;
        }else{
            throw new HttpException('You are not Authorized User', HttpStatus.UNAUTHORIZED);
        }
    }
    
}