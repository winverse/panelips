import KeyvRedis from '@keyv/redis';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@packages/config';
import { Config } from '@src/core/config/index.js';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import Keyv from 'keyv';
import { YoutubeRepository } from './youtube.repository.js';
import { YoutubeService } from './youtube.service.js';

class KeyvCacheAdapter implements CacheStore {
  constructor(private readonly keyv: Keyv) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.keyv.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.keyv.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.keyv.delete(key);
  }
}

@Module({
  imports: [
    TrpcModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => {
        const redisUrl = `redis://${configService.get('redis.host')}:${configService.get(
          'redis.port',
        )}`;
        const store = new KeyvRedis(redisUrl);
        const keyv = new Keyv({ store });
        return {
          store: new KeyvCacheAdapter(keyv),
          ttl: 21600, // 6 hours
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [YoutubeService, YoutubeRepository],
  exports: [YoutubeService, YoutubeRepository],
})
export class YoutubeModule {}
