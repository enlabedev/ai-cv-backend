import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for asking a question in the chat.
 */
export class AskQuestionDto {
  /**
   * The user's question or message.
   */
  @IsString({ message: 'The question must be valid text.' })
  @IsNotEmpty({ message: 'Please ask a question.' })
  question!: string;

  /**
   * Unique session identifier for the user.
   */
  @IsString({ message: 'Session ID must be valid text.' })
  @IsNotEmpty({ message: 'Session ID is required.' })
  sessionId!: string;
}
