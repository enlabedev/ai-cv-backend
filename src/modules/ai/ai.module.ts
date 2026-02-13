import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Module({
  providers: [AiService],
  exports: [AiService],
})
/**
 * Module responsible for AI integrations (OpenAI/OpenRouter).
 * Exports AiService for use in other modules.
 */
export class AiModule {}
