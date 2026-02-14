import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface ContactNotificationPayload {
  name: string;
  email: string;
  phone: string;
  contactDate: string;
  message?: string;
}

/**
 * Service to handle sending notifications.
 * Currently supports email notifications via MailerService.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly fromEmail: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM')!;
  }

  /**
   * Sends a confirmation email to the prospect.
   * Uses the interface payload instead of Database Entity.
   *
   * @param payload - Data required for the notification.
   * @returns `true` if sent successfully, `false` otherwise.
   */
  async sendContactConfirmation(
    payload: ContactNotificationPayload,
  ): Promise<boolean> {
    this.logger.log(`Preparing confirmation email for: ${payload.email}`);

    try {
      await this.mailerService.sendMail({
        to: payload.email,
        from: this.fromEmail,
        subject:
          'Confirmación de Contacto - Enrique Lazo (Senior Full Stack Developer)',
        html: this.getConfirmationTemplate(payload),
      });

      this.logger.log(`Email sent successfully to: ${payload.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${payload.email}. Reason: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Generates the HTML template for the confirmation email.
   *
   * @param payload - Data to populate the template.
   * @returns The HTML string.
   */
  private getConfirmationTemplate(payload: ContactNotificationPayload): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #2c3e50;">¡Hola, ${payload.name}! 👋</h2>
        <p style="color: #34495e; font-size: 16px;">
          Gracias por contactarme a través de mi asistente virtual. He recibido tu solicitud y estos son los datos que registramos:
        </p>
        <ul style="background-color: #f8f9fa; padding: 15px 30px; border-radius: 5px; color: #2c3e50;">
          <li><b>Teléfono:</b> ${payload.phone}</li>
          <li><b>Correo:</b> ${payload.email}</li>
          <li><b>Preferencia de reunión:</b> ${payload.contactDate}</li>
          ${payload.message ? `<li><b>Mensaje:</b> ${payload.message}</li>` : ''}
        </ul>
        <p style="color: #34495e; font-size: 16px;">
          Me pondré en contacto contigo lo antes posible para confirmar nuestra reunión.
        </p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #7f8c8d; font-size: 14px;">
          Saludos cordiales,<br>
          <strong>Enrique Lazo Bello</strong><br>
          <em>Senior Full Stack Developer</em>
        </p>
      </div>
    `;
  }
}
