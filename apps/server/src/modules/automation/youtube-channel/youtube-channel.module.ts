import { GoogleModule } from '@modules/automation/google/google.module.js';
import { YoutubeModule } from '@modules/youtube/index.js';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@packages/config';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { ScrapingProcessor } from './scraping.processor.js';
import { YoutubeChannelService } from './youtube-channel.service.js';

@Module({
  imports: [
    TrpcModule,
    ConfigModule,
    YoutubeModule,
    GoogleModule,
    BullModule.registerQueue({
      name: 'scraping-queue',
    }),
  ],
  providers: [YoutubeChannelService, ScrapingProcessor],
  exports: [YoutubeChannelService],
})
export class YoutubeChannelModule {}
