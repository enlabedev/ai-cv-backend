import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ContactService } from '../contact/contact.service';
import { RagService } from '../rag/rag.service';
import { AiService } from '../ai/ai.service';

describe('ChatService', () => {
  let service: ChatService;
  let contactServiceMock: Record<string, jest.Mock>;
  let ragServiceMock: Record<string, jest.Mock>;
  let aiServiceMock: Record<string, jest.Mock>;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    contactServiceMock = {
      getActiveRequest: jest.fn(),
      processContactFlow: jest.fn(),
      initializeContactFlow: jest.fn(),
    };
    ragServiceMock = {
      getRelevantContext: jest.fn(),
    };
    aiServiceMock = {
      detectContactIntent: jest.fn(),
      generateAnswer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ContactService, useValue: contactServiceMock },
        { provide: RagService, useValue: ragServiceMock },
        { provide: AiService, useValue: aiServiceMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('debería continuar el flujo de contacto si existe uno activo', async () => {
    const mockContact = { id: 1, status: 'PENDING' };
    contactServiceMock.getActiveRequest.mockResolvedValue(mockContact);
    contactServiceMock.processContactFlow.mockResolvedValue(
      '¿Cuál es tu correo?',
    );

    const result = await service.processMessage('Juan', 'session-1');

    expect(contactServiceMock.getActiveRequest).toHaveBeenCalledWith(
      'session-1',
    );
    expect(contactServiceMock.processContactFlow).toHaveBeenCalledWith(
      mockContact,
      'Juan',
    );
    expect(result).toBe('¿Cuál es tu correo?');
    expect(aiServiceMock.detectContactIntent).not.toHaveBeenCalled();
  });

  it('debería iniciar nuevo contacto si la IA detecta intención', async () => {
    contactServiceMock.getActiveRequest.mockResolvedValue(null);
    aiServiceMock.detectContactIntent.mockReturnValue(true);
    contactServiceMock.initializeContactFlow.mockResolvedValue({});

    const result = await service.processMessage(
      'Quiero contactarlo',
      'session-1',
    );

    expect(aiServiceMock.detectContactIntent).toHaveBeenCalledWith(
      'Quiero contactarlo',
    );
    expect(contactServiceMock.initializeContactFlow).toHaveBeenCalledWith(
      'session-1',
    );
    expect(result).toContain('¿cuál es tu nombre?');
  });

  it('debería responder usando RAG si es una pregunta normal', async () => {
    contactServiceMock.getActiveRequest.mockResolvedValue(null);
    aiServiceMock.detectContactIntent.mockReturnValue(false);
    ragServiceMock.getRelevantContext.mockResolvedValue('Contexto del CV');
    aiServiceMock.generateAnswer.mockResolvedValue(
      'Enrique es experto en NestJS',
    );

    const result = await service.processMessage(
      '¿Qué sabe hacer?',
      'session-1',
    );

    expect(ragServiceMock.getRelevantContext).toHaveBeenCalledWith(
      '¿Qué sabe hacer?',
    );
    expect(aiServiceMock.generateAnswer).toHaveBeenCalledWith(
      '¿Qué sabe hacer?',
      'Contexto del CV',
    );
    expect(result).toBe('Enrique es experto en NestJS');
  });

  it('debería devolver mensaje de error amigable si el RAG falla', async () => {
    contactServiceMock.getActiveRequest.mockResolvedValue(null);
    aiServiceMock.detectContactIntent.mockReturnValue(false);
    ragServiceMock.getRelevantContext.mockRejectedValue(
      new Error('Fallo de disco'),
    );

    const result = await service.processMessage('Error', 'session-1');

    expect(result).toContain('tuve un problema interno');
  });
});
