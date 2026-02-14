import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContactRequest,
  ContactStatus,
} from './entities/contact-request.entity';
import { NotificationService } from '../notification/notification.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { randomUUID } from 'crypto';

/**
 * Service to manage contact request flows.
 * Handles creation, updates, and completion of contact requests.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRepository: Repository<ContactRequest>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Retrieves an active (PENDING) contact request for the given session.
   * @param sessionId - The user's session ID.
   * @returns The active contact request or null.
   */
  async getActiveRequest(sessionId: string): Promise<ContactRequest | null> {
    return this.contactRepository.findOne({
      where: { sessionId, status: ContactStatus.PENDING },
    });
  }

  /**
   * Initializes a new contact flow in the database.
   * Creates a new PENDING request.
   * @param sessionId - The user's session ID.
   * @returns The created contact request.
   */
  async initializeContactFlow(sessionId: string): Promise<ContactRequest> {
    const newRequest = this.contactRepository.create({
      sessionId,
      status: ContactStatus.PENDING,
    });

    this.logger.log(
      `New contact flow started for session: ${sessionId}`,
    );
    return this.contactRepository.save(newRequest);
  }

  /**
   * Creates a new contact request from the contact form.
   * @param dto - The contact form data.
   * @returns The created contact request.
   */
  async createContact(dto: CreateContactDto): Promise<ContactRequest> {
    const newRequest = this.contactRepository.create({
      sessionId: randomUUID(),
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      contactDate: dto.meeting_datetime,
      message: dto.message,
      status: ContactStatus.COMPLETED, // Directly completed as it's a form submission
    });

    const savedRequest = await this.contactRepository.save(newRequest);

    // Trigger notification
    this.triggerConfirmationEmail(savedRequest);

    return savedRequest;
  }

  /**
   * State machine to process user data collection.
   * Moves the request through stages: Name -> Phone -> Email -> Date -> Completed.
   * @param request - The current contact request entity.
   * @param message - The user's input message.
   * @returns The next question or a confirmation message.
   */
  async processContactFlow(
    request: ContactRequest,
    message: string,
  ): Promise<string> {
    if (!request.name) {
      request.name = message.trim();
      await this.contactRepository.save(request);
      return `Gracias, ${request.name}. ¿A qué número de celular te podemos contactar?`;
    }

    if (!request.phone) {
      request.phone = message.trim();
      await this.contactRepository.save(request);
      return 'Entendido. ¿Cuál es tu correo electrónico?';
    }

    if (!request.email) {
      request.email = message.trim();
      await this.contactRepository.save(request);
      return '¿Qué fecha y hora te gustaría para la reunión? (Ej: Lunes 15 a las 10am)';
    }

    if (!request.contactDate) {
      request.contactDate = message.trim();
      request.status = ContactStatus.COMPLETED;
      await this.contactRepository.save(request);

      this.triggerConfirmationEmail(request);

      return '¡Excelente! He registrado tus datos. Te hemos enviado un correo de confirmación y Enrique se pondrá en contacto contigo pronto.';
    }

    return 'Tu solicitud ya ha sido procesada anteriormente.';
  }

  /**
   * Delegates email sending to NotificationService.
   * @param request - The completed contact request.
   */
  private async triggerConfirmationEmail(
    request: ContactRequest,
  ): Promise<void> {
    try {
      await this.notificationService.sendContactConfirmation(request);
      this.logger.log(
        `Confirmation email sent for session: ${request.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending email to ${request.email}: ${(error as Error).message}`,
      );
    }
  }
}
