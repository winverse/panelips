import { APP_ROUTER } from '@constants/token.js';
import { LoginModule, LoginRouter } from '@modules/login/index.js';
import { ScrapModule, ScrapRouter } from '@modules/scrap/index.js';
import { Module } from '@nestjs/common';
import { createAppRouter } from '@src/app.router.js';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [TrpcModule, ScrapModule, LoginModule],
  providers: [
    TrpcRouter,
    {
      provide: APP_ROUTER,
      useFactory: createAppRouter,
      inject: [TrpcService, ScrapRouter, LoginRouter],
    },
  ],
})
export class AppModule {}
