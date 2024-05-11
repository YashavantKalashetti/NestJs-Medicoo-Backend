import { IsEmail, IsNotEmpty, IsString, isNotEmpty } from "class-validator";

export class SigninDto{
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}