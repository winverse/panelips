import { APP_ROUTER } from '@constants/token.js';
import { ScrapModule, ScrapRouter } from '@modules/scrap/index.js';
import { Module } from '@nestjs/common';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [TrpcModule, ScrapModule],
  providers: [
    TrpcRouter,
    {
      provide: APP_ROUTER,
      useFactory: (trpcService: TrpcService, scrapRouter: ScrapRouter) => {
        return trpcService.router({
          scrap: scrapRouter.router,
        });
      },
      inject: [TrpcService, ScrapRouter],
    },
  ],
})
export class AppModule {}
