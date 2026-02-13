import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Respuesta simulada de la IA' } }],
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    },
  }));
});

describe('AiService', () => {
  let service: AiService;
  let configServiceMock: any;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    configServiceMock = {
      get: jest.fn().mockReturnValue('fake-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('debería generar una respuesta exitosamente', async () => {
    const result = await service.generateAnswer('¿Experiencia?', 'CV Context');
    expect(result).toBe('Respuesta simulada de la IA');
  });

  it('debería retornar el array de embeddings', async () => {
    const result = await service.createEmbedding('Texto de prueba');
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  it('debería detectar correctamente la intención de contacto', () => {
    const isIntent = service.detectContactIntent(
      'Me gustaría agendar una reunión',
    );
    expect(isIntent).toBe(true);

    const notIntent = service.detectContactIntent('¿Qué lenguajes sabes?');
    expect(notIntent).toBe(false);
  });

  it('debería manejar errores de la API al generar respuesta', async () => {
    (service as any).openaiClient.chat.completions.create.mockRejectedValue(new Error('API Down'));
    await expect(service.generateAnswer('Pregunta', 'Contexto'))
      .rejects
      .toThrow('AI service is not available at the moment.');
  });

  it('debería manejar errores al crear embeddings', async () => {
    (service as any).openaiClient.embeddings.create.mockRejectedValue(new Error('API Down'));

    await expect(service.createEmbedding('Texto'))
      .rejects
      .toThrow('Failed to process text for search.');
  });
});
