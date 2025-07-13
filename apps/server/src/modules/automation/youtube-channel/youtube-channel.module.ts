import { GoogleModule } from '@modules/automation/google/google.module.js';
import { YoutubeModule } from '@modules/youtube/index.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@packages/config';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeChannelService } from './youtube-channel.service.js';

@Module({
  imports: [TrpcModule, ConfigModule, YoutubeModule, GoogleModule],
  providers: [YoutubeChannelService],
  exports: [YoutubeChannelService],
})
export class YoutubeChannelModule {}
