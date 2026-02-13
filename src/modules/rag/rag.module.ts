import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';

@Module({
  imports: [AiModule],
  providers: [RagService],
  exports: [RagService],
  controllers: [RagController],
})
/**
 * Module for Retrieval-Augmented Generation (RAG).
 * Manages knowledge base uploads and context retrieval.
 */
export class RagModule {}
