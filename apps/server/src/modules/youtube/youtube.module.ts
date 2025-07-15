import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@packages/config';
import { Config } from '@src/core/config/index.js';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { redisStore } from 'cache-manager-redis-yet';
import { YoutubeRepository } from './youtube.repository.js';
import { YoutubeService } from './youtube.service.js';

@Module({
  imports: [
    TrpcModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => ({
        store: await redisStore({
          socket: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
          ttl: 3600, // 1 hour
        }),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [YoutubeService, YoutubeRepository],
  exports: [YoutubeService, YoutubeRepository],
})
export class YoutubeModule {}
