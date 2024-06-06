import { Global, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Global()
@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: this.configService.get<boolean>('MAIL_SECURE'), // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
        const mailOptions = {
            from: this.configService.get<string>('MAIL_FROM'),
            to,
            subject,
            text,
            html,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
