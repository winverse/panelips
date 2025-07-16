import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@packages/config';
import { Config } from '@src/core/config/index.js';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeRepository } from './youtube.repository.js';
import { YoutubeService } from './youtube.service.js';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    TrpcModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => {
        const redisUrl = `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`;
        const store = new KeyvRedis(redisUrl);
        return {
          store: new Keyv({ store }),
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
