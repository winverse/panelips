import { YoutubeService } from '@modules/sns/youtube/youtube.service.js';
import { Injectable } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Injectable()
export class YoutubeRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly youtubeService: YoutubeService,
  ) {}
  get router() {
    return this.trpcService.router({
      getNewVideo: this.trpcService.procedure
        .input(
          z.object({
            url: z.string().min(1).max(100).url(),
          }),
        )
        .output(z.array(z.string()))
        .mutation(({ input }) => {
          return this.youtubeService.getNewVideos(input.url);
        }),
    });
  }
}
