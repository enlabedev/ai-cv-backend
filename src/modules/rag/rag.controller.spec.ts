import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

describe('RagController', () => {
  let controller: RagController;
  let ragServiceMock: any;

  beforeEach(async () => {
    ragServiceMock = {
      updateKnowledgeBase: jest.fn(),
      clearKnowledgeBase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RagController],
      providers: [{ provide: RagService, useValue: ragServiceMock }],
    }).compile();

    controller = module.get<RagController>(RagController);
  });

  describe('uploadKnowledge', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'cv.json',
      encoding: '7bit',
      mimetype: 'application/json',
      buffer: Buffer.from('[]'),
      size: 1024,
    } as Express.Multer.File;

    it('debería llamar al servicio y retornar éxito con un archivo válido', async () => {
      ragServiceMock.updateKnowledgeBase.mockResolvedValue(5);

      const result = await controller.uploadKnowledge(mockFile);

      expect(ragServiceMock.updateKnowledgeBase).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(result).toEqual({
        message: 'Base de conocimiento actualizada exitosamente.',
        fragmentsLoaded: 5,
      });
    });

    it('debería lanzar BadRequestException si no se envía archivo', async () => {
      await expect(
        controller.uploadKnowledge(undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el tipo de archivo no es JSON', async () => {
      const badFile = { ...mockFile, mimetype: 'image/png' };

      await expect(controller.uploadKnowledge(badFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('clearKnowledge', () => {
    it('debería llamar al servicio para limpiar la base de conocimiento', async () => {
      ragServiceMock.clearKnowledgeBase.mockResolvedValue(undefined);

      const result = await controller.clearKnowledge();

      expect(ragServiceMock.clearKnowledgeBase).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Base de conocimiento purgada exitosamente.',
      });
    });
  });
});
