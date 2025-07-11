import { ScrapService } from '@modules/scrap/scrap.service.js';
import { YoutubeModule } from '@modules/sns/youtube/youtube.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@packages/config';
import { TrpcModule } from '@src/trpc/trpc.module.js';

@Module({
  imports: [TrpcModule, ConfigModule, YoutubeModule],
  providers: [ScrapService],
  exports: [ScrapService],
})
export class ScrapModule {}
