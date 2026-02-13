import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ContactModule } from '../contact/contact.module';
import { RagModule } from '../rag/rag.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ContactModule, RagModule, AiModule],
  controllers: [ChatController],
  providers: [ChatService],
})
/**
 * Module for handling chat interactions.
 * Orchestrates the flow between AI, RAG, and Contact modules.
 */
export class ChatModule {}
