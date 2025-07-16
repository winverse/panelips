import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { GoogleModule } from './google/index.js';
import { YoutubeChannelModule } from './youtube-channel/index.js';

@Module({
  imports: [
    GoogleModule,
    YoutubeChannelModule,
    BullModule.registerQueue({
      name: 'scraping-queue',
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 10,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
})
export class AutomationModule {}
