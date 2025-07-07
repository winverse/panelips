import { Module } from '@nestjs/common';
import { YoutubeService } from '@providers/sns/youtube/youtube.service.js';

@Module({
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
