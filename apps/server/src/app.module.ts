import { APP_ROUTER } from '@constants/token.js';
import { LoginModule, LoginRouter } from '@modules/login/index.js';
import { ScrapModule, ScrapRouter } from '@modules/scrap/index.js';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from '@packages/config';
import { configuration, validateConfig } from '@providers/config/index.js';
import { createAppRouter } from '@src/app.router.js';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
    }),
    ConfigModule,
    TrpcModule,
    ScrapModule,
    LoginModule,
  ],
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
