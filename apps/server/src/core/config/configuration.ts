import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Config, Environment } from './config.interface.js';
import { validateConfig } from './config.validator.js';

export const configuration = (): Config => {
  const environment = process.env.NODE_ENV || 'production';
  const filename = `.env.${environment}`;

  const envFilePath = path.resolve(process.cwd(), 'env', filename);
  const existFile = fs.existsSync(envFilePath);

  if (!existFile) {
    throw new Error(`Missing or not built config file: ${envFilePath}`);
  }

  const rawConfig = dotenv.config({ path: envFilePath }).parsed;

  if (!rawConfig) {
    throw new Error('Failed to load config');
  }

  try {
    const config: Config = {
      env: environment as Environment,
      app: {
        port: Number(rawConfig.PORT),
      },
      google: {
        apiKey: rawConfig.GOOGLE_API_KEY,
      },
      db: {
        provider: rawConfig.DATABASE_PROVIDER as 'mongodb',
        url: rawConfig.DATABASE_URL,
      },
      redis: {
        host: rawConfig.REDIS_HOST,
        port: Number(rawConfig.REDIS_PORT),
      },
    };

    return validateConfig(config);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to import configuration file', { cause: error });
  }
};
