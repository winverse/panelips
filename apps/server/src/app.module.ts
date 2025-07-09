import { APP_ROUTER } from '@constants/token.js';
import { LoginModule } from '@modules/login/index.js';
import { ScrapModule } from '@modules/scrap/index.js';
import { YoutubeModule } from '@modules/sns/youtube/index.js';
import { Module, INestApplication } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from '@packages/config';
import { createAppRouter } from '@src/app.router.js';
import { configuration } from '@src/core/config/index.js';
import { CoreModule } from '@src/core/core.module.js';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ConfigModule,
    CoreModule,
    TrpcModule,
    ScrapModule,
    LoginModule,
    YoutubeModule,
  ],
  providers: [
    TrpcRouter, // TrpcRouter will now create and manage the appRouter
  ],
})
export class AppModule {}