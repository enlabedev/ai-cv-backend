import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { AiService } from '../ai/ai.service';

export interface EmbeddingChunk {
  id: string;
  text: string;
  embedding: number[];
}

/**
 * Service to manage RAG operations.
 * Handles loading/saving embeddings and searching for relevant context.
 */
@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private embeddings: EmbeddingChunk[] = [];
  private readonly filePath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {
    const isVercel = process.env.VERCEL === '1';
    const defaultPath = isVercel 
      ? '/tmp/cv-embeddings.json' 
      : './data/cv-embeddings.json';

    const configuredPath = this.configService.get<string>(
      'EMBEDDINGS_FILE_PATH',
      defaultPath,
    );
    this.filePath = path.isAbsolute(configuredPath) 
      ? configuredPath 
      : path.resolve(process.cwd(), configuredPath);
  }

  onModuleInit() {
    this.loadEmbeddingsFromDisk();
  }

  private loadEmbeddingsFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.embeddings = JSON.parse(fileContent) as EmbeddingChunk[];
        this.logger.log(
          `Loaded ${this.embeddings.length} fragments from disk.`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error reading embeddings file: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Updates the knowledge base dynamically with a new file.
   * @param fileBuffer - The buffer of the uploaded JSON file.
   * @returns The number of fragments loaded.
   */
  async updateKnowledgeBase(fileBuffer: Buffer): Promise<number> {
    let jsonContent: any;

    try {
      const rawContent = fileBuffer.toString('utf-8');
      jsonContent = JSON.parse(rawContent);
    } catch (error) {
      throw new BadRequestException('El archivo no tiene un formato JSON válido.');
    }

    if (!Array.isArray(jsonContent)) {
      throw new BadRequestException('El archivo proporcionado no es un JSON de embeddings válido (se esperaba un array).');
    }

    const isValid = jsonContent.every(
      (item) => item.text && Array.isArray(item.embedding)
    );

    if (!isValid) {
      throw new BadRequestException('El archivo proporcionado no es un JSON de embeddings válido.');
    }

    this.embeddings = jsonContent as EmbeddingChunk[];
    try {
      await fsp.writeFile(this.filePath, JSON.stringify(this.embeddings));
    } catch (error) {
      this.logger.warn('No se pudo persistir en disco (normal en Vercel), pero los datos están en memoria.');
    }

    return this.embeddings.length;
  }

  /**
   * Clears knowledge from both RAM and Disk.
   */
  async clearKnowledgeBase(): Promise<void> {
    this.embeddings = [];

    try {
      if (fs.existsSync(this.filePath)) {
        await fsp.unlink(this.filePath);
        this.logger.log('Knowledge base file deleted from disk.');
      }
    } catch (error) {
      this.logger.error(
        `Could not delete file from disk: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Search for the most relevant context chunks for a given question.
   * @param question - The user's question.
   * @param topK - Number of top results to return.
   * @returns Concatenated relevant text chunks.
   */
  async getRelevantContext(
    question: string,
    topK: number = 3,
  ): Promise<string> {
    if (this.embeddings.length === 0) return '';

    const questionEmbedding = await this.aiService.createEmbedding(question);
    const rankedChunks = this.embeddings
      .map((chunk) => ({
        text: chunk.text,
        similarity: this.cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return rankedChunks.map((c) => c.text).join('\n\n---\n\n');
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA === 0 || normB === 0
      ? 0
      : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
