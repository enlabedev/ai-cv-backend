import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  NotificationService,
  ContactNotificationPayload,
} from './notification.service';
import { Logger } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let mailerServiceMock: Record<string, jest.Mock>;
  let configServiceMock: Record<string, jest.Mock>;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    mailerServiceMock = {
      sendMail: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'EMAIL_FROM') return 'noreply@test.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: MailerService, useValue: mailerServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  const mockPayload: ContactNotificationPayload = {
    name: 'Enrique',
    email: 'test@domain.com',
    phone: '999999999',
    contactDate: 'Mañana a las 10am',
  };

  it('debería enviar el correo exitosamente y retornar true', async () => {
    mailerServiceMock.sendMail.mockResolvedValue('Email sent');

    const result = await service.sendContactConfirmation(mockPayload);

    expect(result).toBe(true);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockPayload.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        subject: expect.stringContaining('Confirmación de Contacto'),
      }),
    );
  });

  it('debería capturar el error, no lanzar excepción y retornar false', async () => {
    mailerServiceMock.sendMail.mockRejectedValue(new Error('SMTP Error'));

    const result = await service.sendContactConfirmation(mockPayload);

    expect(result).toBe(false);
    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
  });
});
