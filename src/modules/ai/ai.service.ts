import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiClient: OpenAI;

  /**
   * Create the AiService and configure the OpenAI client for OpenRouter.
   *
   * @param configService - Configuration provider used to obtain settings (expects `OPENAI_API_KEY`).
   *
   * @remarks
   * Initializes an OpenAI client using the API key from `ConfigService` and
   * sets the client's base URL to the OpenRouter endpoint (`https://openrouter.ai/api/v1`).
   */
  constructor(private readonly configService: ConfigService) {
    this.openaiClient = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  /**
   * Generate a final answer using the injected context (RAG).
   *
   * @param question - The user's question.
   * @param context - Grounding context (e.g., CV text) used to produce the response.
   * @returns A generated answer string.
   *
   * @remarks
   * Builds a system prompt from the provided context and calls the chat
   * completions API to generate a response. If the model does not return
   * content a fallback string is returned. Errors are logged and rethrown
   * as an InternalServerErrorException for upstream handling.
   */
  async generateAnswer(question: string, context: string): Promise<string> {
    this.logger.log(`Generating LLM answer for question: "${question}"`);

    const systemPrompt = `
      Eres un Vendedor persuasivo y profesional encargado de promocionar el perfil de Enrique Lazo Bello.
      Tu objetivo es responder preguntas sobre su experiencia y habilidades basándote EXCLUSIVAMENTE en la siguiente información de su CV.
      Si la respuesta no está en el contexto, indica amablemente que no tienes esa información pero que pueden contactarlo directamente.
      Responde de manera entusiasta, destacando sus logros.

      Información del CV:
      ${context}
          `.trim();

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: 'google/gemma-3-12b-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
      });
      return (
        completion.choices[0]?.message?.content ||
        'Could not generate a coherent response.'
      );
    } catch (error) {
      this.logger.error(
        `OpenAI/OpenRouter error: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'AI service is not available at the moment.',
      );
    }
  }

  /**
   * Create an embedding vector for the provided text.
   *
   * @param text - Text to convert into an embedding vector.
   * @returns A numeric array representing the embedding vector.
   * @throws InternalServerErrorException when embedding creation fails.
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(
        `Error creating embeddings: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to process text for search.',
      );
    }
  }

  /**
   * Heuristic detection of contact intent.
   *
   * @param question - The user's question or message text.
   * @returns `true` if the text likely expresses an intent to contact; otherwise `false`.
   *
   * @remarks
   * Using regex/keyword checks is faster and cheaper than calling the LLM,
   * preserving API calls for more complex responses.
   */
  detectContactIntent(question: string): boolean {
    const keywords = [
      'contactar',
      'contacto',
      'cita',
      'reunion',
      'agendar',
      'llamar',
      'correo',
      'telefono',
      'celular',
      'whatsapp',
    ];
    const intentWords = [
      'quiero',
      'gustaria',
      'deseo',
      'quisiera',
      'puedes',
      'interesa',
      'necesito',
    ];

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const lowerQuestion = normalize(question);

    const hasKeyword = keywords.some((k) => lowerQuestion.includes(k));
    const hasIntent = intentWords.some((i) => lowerQuestion.includes(i));

    return hasKeyword && hasIntent;
  }
}
