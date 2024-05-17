import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import logger from 'src/utils/logger.util';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  async send({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }) {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT')),
      secure:
        Number(this.configService.get<string>('SMTP_PORT')) === 465
          ? true
          : false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: this.configService.get<string>('SMTP_USERNAME'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
    try {
      const info = await transporter.sendMail({
        from: `"${this.configService.get<string>('APP_NAME')}" <${this.configService.get<string>('EMAIL_SENDER')}>`,
        to: to,
        subject: subject,
        html: body,
      });
      console.log('Message sent: %s', info.messageId);
    } catch (error: any) {
      logger(module).info(
        `Error sending email: ${error.message}`,
      );
    }
  }
}
