import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';
import { GoogleService } from './google.service.js';

export function createGoogleRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const googleService = app.get(GoogleService);

  return trpcService.router({
    login: trpcService.procedure
      .meta({ description: '스크래퍼 구글 로그인' })
      .output(
        z.object({
          success: z.boolean(),
          error: z.string().optional(),
        }),
      )
      .mutation(async () => {
        try {
          await googleService.performIntegratedLoginFlow();
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An unknown error occurred';
          return { success: false, error: message };
        }
      }),
  });
}

export type GoogleRouter = ReturnType<typeof createGoogleRouter>;
