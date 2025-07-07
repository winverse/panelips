import { ConfigService as Service } from '@packages/config';

export type Environment = 'development' | 'production' | 'test';

export type Config = {
  readonly env: 'development' | 'production' | 'test';
  readonly app: AppConfig;
  readonly google: GoogleConfig;
  readonly db: DBConfig;
};

export type AppConfig = {
  readonly port: number;
};

export type GoogleConfig = {
  readonly apiKey: string;
};

export type DBConfig = {
  readonly provider: 'mongodb';
  readonly url: string;
};
