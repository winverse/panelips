import Redis from 'ioredis';

interface Service {
  connection(): Promise<void>;
  get generateKey(): GenerateRedisKey;
  get queueName(): Record<QueueName, string>;
  addToScrapVideoQueue(data: CreateScrapVideoQueueData): Promise<number>;
}

type RedisOptions = {
  port: number;
  host: string;
};

export class RedisService extends Redis.default implements Service {
  host: string;
  port: number;
  constructor({ port, host }: RedisOptions) {
    if (!port) throw new Error('redis port is required');
    if (!host) throw new Error('redis host is required');
    super({ port: port, host });
    this.host = host;
    this.port = port;
  }

  public async connection(): Promise<void> {
    return new Promise((resolve) => {
      super.connect(() => {
        resolve();
        console.info(`INFO: Redis connected to "${this.host}:${this.port}"`);
      });
    });
  }

  public get generateKey(): GenerateRedisKey {
    return {
      // recommendedPost: (postId: string) => `${postId}:recommend`, 예시
    };
  }

  public get queueName(): Record<QueueName, string> {
    return {
      scrapVideo: 'scrapVideo',
    };
  }

  public async addToScrapVideoQueue(data: CreateScrapVideoQueueData): Promise<number> {
    const queueName = this.queueName.scrapVideo;
    return await this.lpush(queueName, JSON.stringify(data));
  }
}

type GenerateRedisKey = Record<string, (...args: any[]) => string>;

type QueueName = 'scrapVideo';

type CreateScrapVideoQueueData = {
  title: string;
  url: string;
  description: string;
  channelId: string;
};
