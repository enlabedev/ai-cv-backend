import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { RagService } from './rag.service';
import { AiService } from '../ai/ai.service';

jest.mock('fs');
jest.mock('fs/promises');

describe('RagService', () => {
  let service: RagService;
  let aiServiceMock: any;
  let configServiceMock: any;

  const validJson = JSON.stringify([
    { id: '1', text: 'Test Text', embedding: [0.1, 0.2] },
  ]);
  const invalidJson = '{ "id": "roto" '; // Malformed JSON

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    aiServiceMock = {
      createEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]),
    };

    configServiceMock = {
      get: jest.fn().mockReturnValue('./data/cv-embeddings.json'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: AiService, useValue: aiServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  describe('updateKnowledgeBase', () => {
    it('debería actualizar el conocimiento si el JSON es válido', async () => {
      const buffer = Buffer.from(validJson);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsp.writeFile as jest.Mock).mockResolvedValue(undefined);

      const count = await service.updateKnowledgeBase(buffer);

      expect(count).toBe(1);
      expect(fsp.writeFile).toHaveBeenCalled();
      expect((service as any).embeddings).toHaveLength(1);
    });

    it('debería crear el directorio si no existe', async () => {
      const buffer = Buffer.from(validJson);

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fsp.mkdir as jest.Mock).mockResolvedValue(undefined);

      await service.updateKnowledgeBase(buffer);

      expect(fsp.mkdir).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    it('debería lanzar BadRequestException si el JSON es inválido', async () => {
      const buffer = Buffer.from(invalidJson);

      await expect(service.updateKnowledgeBase(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería lanzar BadRequestException si el JSON no tiene la estructura correcta', async () => {
      const badStructureJson = JSON.stringify([
        { id: '1', text: 'Sin embedding' },
      ]);
      const buffer = Buffer.from(badStructureJson);

      await expect(service.updateKnowledgeBase(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('clearKnowledgeBase', () => {
    it('debería borrar el archivo y limpiar la memoria', async () => {
      (service as any).embeddings = [{ id: '1' }];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsp.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.clearKnowledgeBase();

      expect(fsp.unlink).toHaveBeenCalled();
      expect((service as any).embeddings).toHaveLength(0);
    });

    it('debería manejar errores de borrado silenciosamente', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsp.unlink as jest.Mock).mockRejectedValue(
        new Error('Permiso denegado'),
      );

      await expect(service.clearKnowledgeBase()).resolves.not.toThrow();
    });
  });
});
