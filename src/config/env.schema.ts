import * as Joi from 'joi';

/**
 * Validation schema for environment variables.
 * Ensures strict typing and default values for configuration.
 */
export const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  POSTGRES_USER: Joi.string().default('postgres'),
  POSTGRES_PASSWORD: Joi.string().default('postgres'),
  POSTGRES_DB: Joi.string().default('ai_cv'),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),

  OPENAI_API_KEY: Joi.string().required(),

  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().default('"Enrique Lazo" <noreply@tudominio.com>'),

  EMBEDDINGS_FILE_PATH: Joi.string().default('./data/cv-embeddings.json'),
});
