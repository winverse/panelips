import { YoutubeRouter } from '@modules/sns/youtube/youtube.router.js';
import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeService } from './youtube.service.js';
import { YoutubeRepository } from './youtube.repository';

@Module({
  imports: [TrpcModule],
  providers: [YoutubeService, YoutubeRouter, YoutubeRepository],
  exports: [YoutubeService, YoutubeRouter],
})
export class YoutubeModule {}
