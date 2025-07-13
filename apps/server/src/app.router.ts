import { createAutomationRouter } from '@modules/automation/index.js';
import { createYoutubeRouter } from '@modules/youtube/youtube.router.js';
import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type AppRouter = ReturnType<typeof createAppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function createAppRouter(app: INestApplication, trpcService: TrpcService) {
  const automationRouter = createAutomationRouter(app);
  const youtubeRouter = createYoutubeRouter(app);

  return trpcService.router({
    automation: automationRouter,
    youtube: youtubeRouter,
  });
}
