import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';
import { YoutubeChannelService } from './youtube-channel.service.js';

export function createYoutubeChannelRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const youtubeChannelService = app.get(YoutubeChannelService);

  return trpcService.router({
    scrap: trpcService.procedure
      .meta({ description: '유튜브 채널 스크랩' })
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          url: z.string(),
          channelId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return youtubeChannelService.addScrapingJob(input);
      }),
  });
}

export type YoutubeChannelRouter = ReturnType<typeof createYoutubeChannelRouter>;
