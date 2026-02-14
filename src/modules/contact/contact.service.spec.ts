import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactService } from './contact.service';
import {
  ContactRequest,
  ContactStatus,
} from './entities/contact-request.entity';
import { NotificationService } from '../notification/notification.service';
import { Logger } from '@nestjs/common';

describe('ContactService', () => {
  let service: ContactService;
  let mockRepository: Record<string, jest.Mock>;
  let mockNotificationService: Record<string, jest.Mock>;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockNotificationService = {
      sendContactConfirmation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: getRepositoryToken(ContactRequest),
          useValue: mockRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('debería guardar el nombre y preguntar por el teléfono', async () => {
    const mockRequest = {
      id: 1,
      sessionId: '123',
      status: ContactStatus.PENDING,
    } as Partial<ContactRequest> as ContactRequest;

    mockRepository.save.mockResolvedValue({ ...mockRequest, name: 'Enrique' });

    const response = await service.processContactFlow(mockRequest, 'Enrique');

    expect(mockRequest.name).toBe('Enrique');
    expect(mockRepository.save).toHaveBeenCalledWith(mockRequest);
    expect(response).toContain(
      '¿A qué número de celular te podemos contactar?',
    );
  });

  it('debería completar el flujo y llamar al servicio de notificaciones', async () => {
    const mockRequest = {
      id: 1,
      sessionId: '123',
      status: ContactStatus.PENDING,
      name: 'Enrique',
      phone: '999999999',
      email: 'test@test.com',
    } as Partial<ContactRequest> as ContactRequest;

    const response = await service.processContactFlow(
      mockRequest,
      'Lunes a las 10am',
    );

    expect(mockRequest.contactDate).toBe('Lunes a las 10am');
    expect(mockRequest.status).toBe(ContactStatus.COMPLETED);
    expect(
      mockNotificationService.sendContactConfirmation,
    ).toHaveBeenCalledWith(mockRequest);
    expect(response).toContain('He registrado tus datos');
  });
});
