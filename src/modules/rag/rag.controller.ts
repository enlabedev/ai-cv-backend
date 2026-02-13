import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';

@Controller('knowledge')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  /**
   * Upload and replace the CV knowledge base.
   * Expects a JSON file with embeddings.
   *
   * @param file - The uploaded JSON file.
   * @returns Success message and count of fragments loaded.
   * @throws BadRequestException if no file or incorrect type.
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadKnowledge(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo.');
    }

    if (file.mimetype !== 'application/json') {
      throw new BadRequestException('El archivo debe ser un JSON.');
    }

    const fragmentsCount = await this.ragService.updateKnowledgeBase(
      file.buffer,
    );

    return {
      message: 'Base de conocimiento actualizada exitosamente.',
      fragmentsLoaded: fragmentsCount,
    };
  }

  /**
   * Clear knowledge base from memory and disk.
   * @returns Success message.
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearKnowledge() {
    await this.ragService.clearKnowledgeBase();
    return { message: 'Base de conocimiento purgada exitosamente.' };
  }
}
