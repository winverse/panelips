import { z } from 'zod';
import type { Config } from './config.interface.js';

const configSchema = z.object({
  env: z.enum(['development', 'production', 'test']),
  app: z.object({
    port: z.number(),
  }),
  db: z.object({
    database_provider: z.literal('mongodb', {
      errorMap: () => ({ message: 'DB provider must be mongodb' }),
    }),
    database_url: z
      .string({ required_error: 'Database URL is required' })
      .min(1, { message: 'Database URL cannot be empty' }),
  }),
  google: z.object({
    googleApiKey: z.string({ required_error: 'Google API key is required' }),
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
