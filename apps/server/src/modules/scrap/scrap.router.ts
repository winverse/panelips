import { INestApplication } from '@nestjs/common'; // Import INestApplication
import { TrpcService } from '@src/trpc/trpc.service.js';
import { ScrapService } from './scrap.service.js'; // Relative import

export function createScrapRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const scrapService = app.get(ScrapService);

  return trpcService.router({
    youtubeChannel: trpcService.procedure
      .meta({ description: '유튜브 채널 스크랩' })
      .mutation(async () => {
        try {
          await scrapService.youtubeChannelScrap();
          return { success: true, message: '유튜브 채널 스크랩 작업이 시작되었습니다.' };
        } catch (error) {
          console.error('유튜브 채널 스크랩 중 오류 발생:', error);
          return { success: false, message: `스크랩 실패: ${error.message || '알 수 없는 오류'}` };
        }
      }),
  });
}

export type ScrapRouter = ReturnType<typeof createScrapRouter>; // Export type for consistency
