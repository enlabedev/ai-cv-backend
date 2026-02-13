import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: jest.Mocked<Partial<ChatService>>;

  beforeEach(async () => {
    chatService = {
      processMessage: jest.fn().mockResolvedValue('Respuesta simulada'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('debería retornar la respuesta del servicio', async () => {
    const result = await controller.ask({ question: 'Hola', sessionId: '123' });
    expect(result).toEqual({ answer: 'Respuesta simulada' });
    expect(chatService.processMessage).toHaveBeenCalledWith('Hola', '123');
  });
});
