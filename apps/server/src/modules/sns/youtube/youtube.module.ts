import { YoutubeRouter } from '@modules/sns/youtube/youtube.router.js';
import { Module } from '@nestjs/common';
import { MongoModule } from '@providers/mongo/index.js';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { YoutubeService } from './youtube.service.js';

@Module({
  imports: [TrpcModule, MongoModule],
  providers: [YoutubeService, YoutubeRouter],
  exports: [YoutubeService, YoutubeRouter],
})
export class YoutubeModule {}
