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
        try {
          const { title, description, url, channelId } = input;
          await youtubeChannelService.youtubeChannelScrap({ title, description, url, channelId });
          return { success: true, message: '유튜브 채널 스크랩 작업이 시작되었습니다.' };
        } catch (error) {
          console.error('유튜브 채널 스크랩 중 오류 발생:', error);
          return { success: false, message: `스크랩 실패: ${error.message || '알 수 없는 오류'}` };
        }
      }),
  });
}

export type YoutubeChannelRouter = ReturnType<typeof createYoutubeChannelRouter>;
