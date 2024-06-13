import { Gender } from "@prisma/client";
import { Exclude } from "class-transformer";
import { IsDate, IsDateString, IsLowercase, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength, minLength } from "class-validator";

export class PatientSignupDto{
    @IsString()
    @IsNotEmpty()
    name:string;

    @IsNumber()
    @IsNotEmpty()
    aadharNumber:number 
    
    @IsNumber()
    @IsNotEmpty()
    contactNumber: number
    
    @IsNotEmpty()
    gender:Gender

    @IsString()
    @IsNotEmpty()
    email:string
    
    @IsDateString()
    @IsNotEmpty()
    dob:Date

    @IsString()
    @IsNotEmpty()
    @MinLength(8 , { message: "Password must be atleast 8 characters long" })
    password:string

    @IsString()
    @IsNotEmpty()
    @MinLength(20, { message: "Enter a Detailed Address" })
    address:string

    constructor(partials: Partial<PatientSignupDto>){
        Object.assign(this,partials)
    }
}