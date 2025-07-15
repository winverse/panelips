import { AutomationModule } from '@modules/automation/index.js';
import { YoutubeModule } from '@modules/youtube/index.js';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule, ConfigService } from '@packages/config';
import { Config, configuration } from '@src/core/config/index.js';
import { CoreModule } from '@src/core/core.module.js';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    CoreModule,
    TrpcModule,
    AutomationModule,
    YoutubeModule,
  ],
  providers: [
    TrpcRouter, // TrpcRouter will now create and manage the appRouter
  ],
})
export class AppModule {}
