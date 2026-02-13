import { Injectable, Logger } from '@nestjs/common';
import { ContactService } from '../contact/contact.service';
import { RagService } from '../rag/rag.service';
import { AiService } from '../ai/ai.service';

/**
 * Service to handle chat logic.
 * Orchestrates:
 * 1. Contact flow (if active or intent detected).
 * 2. RAG flow (searching context and generating answers).
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly contactService: ContactService,
    private readonly ragService: RagService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Process an incoming message from the user.
   *
   * @param question - The user's input text.
   * @param sessionId - The unique session ID for the user.
   * @returns The generated response/answer.
   */
  async processMessage(question: string, sessionId: string): Promise<string> {
    this.logger.log(`Processing message for session: ${sessionId}`);

    // 1. Check for active contact flow (PENDING state)
    const activeContact = await this.contactService.getActiveRequest(sessionId);
    if (activeContact) {
      return this.contactService.processContactFlow(activeContact, question);
    }

    // 2. Check for contact intent using heuristic detection
    const isContactIntent = this.aiService.detectContactIntent(question);
    if (isContactIntent) {
      await this.contactService.initializeContactFlow(sessionId);
      return '¡Claro! Me encantaría ponerte en contacto con Enrique. Para empezar, ¿cuál es tu nombre?';
    }

    // 3. Normal RAG Flow (CV Questions)
    try {
      // 3.1 Retrieve relevant context from embeddings
      const context = await this.ragService.getRelevantContext(question);

      // 3.2 Generate final answer using LLM
      return await this.aiService.generateAnswer(question, context);
    } catch (error) {
      this.logger.error(`RAG Flow Error: ${(error as Error).message}`);
      return 'Lo siento, tuve un problema interno al buscar esa información. ¿Podrías intentar de nuevo?';
    }
  }
}
