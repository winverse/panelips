import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeRepository } from './youtube.repository.js';
import { YoutubeService } from './youtube.service.js';

@Module({
  imports: [TrpcModule],
  providers: [YoutubeService, YoutubeRepository],
  exports: [YoutubeService, YoutubeRepository],
})
export class YoutubeModule {}
