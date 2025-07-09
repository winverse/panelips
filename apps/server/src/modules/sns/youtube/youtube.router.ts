import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';
import { YoutubeService } from './youtube.service.js';

// Export a function that creates the router
export function createYoutubeRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const youtubeService = app.get(YoutubeService);

  return trpcService.router({
    getNewVideo: trpcService.procedure
      .meta({ description: '새 유튜브 동영상 가져오기' }) // Korean description
      .input(
        z.object({
          url: z.string().min(1).max(100).url(),
        }),
      )
      .output(z.array(z.string())) // Assuming it returns an array of video URLs/IDs
      .mutation(async ({ input }) => {
        // Changed to async mutation
        try {
          const newVideos = await youtubeService.getNewVideos(input.url);
          return newVideos;
        } catch (error) {
          console.error('새 유튜브 동영상 가져오는 중 오류 발생:', error);
          throw new Error(`새 동영상 가져오기 실패: ${error.message || '알 수 없는 오류'}`);
        }
      }),
  });
}

export type YoutubeRouter = ReturnType<typeof createYoutubeRouter>; // Export type for consistency
