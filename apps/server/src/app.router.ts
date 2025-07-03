import { ScrapRouter } from '@modules/scrap/index.js';
import { TrpcService } from '@src/trpc/trpc.service.js';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type AppRouter = ReturnType<typeof createAppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function createAppRouter(
  trpcService: TrpcService,
  scrapRouter: ScrapRouter,
) {
  return trpcService.router({
    scrap: scrapRouter.router,
  });
}
