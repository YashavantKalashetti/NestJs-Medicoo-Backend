import { Injectable } from "@nestjs/common";
import { EmailInputDto } from "src/dto/CreateDto/emailInput.dto";

export async function EmailService(emailInputDto: EmailInputDto){

    const {email, message, subject} = emailInputDto;

    try {
        const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/mail/sendEmail`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email,
                subject,
                message
            })
        });

        if(response.ok){
            return true;
        }

        return false;
    } catch (error) {
        return false;
    }

}