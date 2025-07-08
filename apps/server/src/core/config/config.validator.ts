import { z } from 'zod';
import type { Config } from './config.interface.js';

const configSchema = z.object({
  env: z.enum(['development', 'production', 'test']),
  app: z.object({
    port: z.number(),
  }),
  db: z.object({
    provider: z.literal('mongodb', {
      errorMap: () => ({ message: 'DB provider must be mongodb' }),
    }),
    url: z
      .string({ required_error: 'Database URL is required' })
      .min(1, { message: 'Database URL cannot be empty' }),
  }),
  google: z.object({
    apiKey: z.string({ required_error: 'Google API key is required' }),
  }),
});

export const validateConfig = (config: unknown): Config => {
  const validationResult = configSchema.safeParse(config);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map((e) => `${e.path.join('.') || 'root'}: ${e.message}`)
      .join('; ');
    throw new Error(`Config validation failed: ${errorMessage}`);
  }

  return validationResult.data;
};
