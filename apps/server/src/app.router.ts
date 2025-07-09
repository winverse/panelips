import { createLoginRouter } from '@modules/login/login.router.js'; // Added .js back
import { createScrapRouter } from '@modules/scrap/scrap.router.js'; // Added .js back
import { createYoutubeRouter } from '@modules/sns/youtube/youtube.router.js'; // Added .js back
import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type AppRouter = ReturnType<typeof createAppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function createAppRouter(app: INestApplication, trpcService: TrpcService) {
  const loginRouter = createLoginRouter(app);
  const scrapRouter = createScrapRouter(app);
  const youtubeRouter = createYoutubeRouter(app);

  return trpcService.router({
    scrap: scrapRouter,
    login: loginRouter,
    youtube: youtubeRouter,
  });
}
