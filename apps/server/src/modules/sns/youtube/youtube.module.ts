import { YoutubeRouter } from '@modules/sns/youtube/youtube.router.js';
import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeRepository } from './youtube.repository.js';
import { YoutubeService } from './youtube.service.js';

@Module({
  imports: [TrpcModule],
  providers: [YoutubeService, YoutubeRouter, YoutubeRepository],
  exports: [YoutubeService, YoutubeRouter],
})
export class YoutubeModule {}
