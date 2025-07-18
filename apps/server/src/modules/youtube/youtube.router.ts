import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';
import { YoutubeService } from './youtube.service.js';

export function createYoutubeRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const youtubeService = app.get(YoutubeService);

  return trpcService.router({
    getNewVideo: trpcService.procedure
      .meta({ description: '새 유튜브 동영상 가져오기' })
      .input(
        z.object({
          url: z.string().min(1).max(100).url(),
        }),
      )
      .output(
        z.array(
          z.object({
            title: z.string(),
            url: z.string(),
            thumbnail: z.string().optional(),
            description: z.string(),
            channelId: z.string(),
            isJsonAnalysisComplete: z.boolean(),
            isScriptAnalysisComplete: z.boolean(),
          }),
        ),
      )
      .query(async ({ input }) => {
        try {
          return youtubeService.getNewVideos(input.url);
        } catch (error) {
          console.error('새 유튜브 동영상 가져오는 중 오류 발생:', error);
          throw new Error(`새 동영상 가져오기 실패: ${error.message || '알 수 없는 오류'}`);
        }
      }),

    getChannels: trpcService.procedure
      .meta({ description: '채널 정보 불러오기' })
      .output(z.array(z.object({ url: z.string(), title: z.string() })))
      .query(async () => {
        return youtubeService.getChannels();
      }),

    getVideoDataByDateRange: trpcService.procedure
      .meta({ description: '기간별 유튜브 스크립트/JSON 데이터 조회 (채널 필터링 포함)' })
      .input(
        z.object({
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
          channelFilter: z.string().optional(), // 채널 ID 또는 채널명
        }),
      )
      .output(
        z.array(
          z.object({
            id: z.string(),
            videoId: z.string(),
            title: z.string(),
            url: z.string(),
            publishedAt: z.date(),
            channelTitle: z.string(),
            hasScript: z.boolean(),
            hasJson: z.boolean(),
            scriptData: z.any().nullable(),
            jsonData: z.any().nullable(),
          }),
        ),
      )
      .query(async ({ input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        return youtubeService.getVideoDataByDateRange(startDate, endDate, input.channelFilter);
      }),
  });
}

export type YoutubeRouter = ReturnType<typeof createYoutubeRouter>;
