import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { AskQuestionDto } from './dto/ask-question.dto';

/**
 * Controller for chat-related endpoints.
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Process a user question.
   *
   * @param askQuestionDto - The question data transfer object.
   * @returns The generated answer.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 86400000 } })
  async ask(@Body() askQuestionDto: AskQuestionDto) {
    const answer = await this.chatService.processMessage(
      askQuestionDto.question,
      askQuestionDto.sessionId,
    );
    return { answer };
  }
}
