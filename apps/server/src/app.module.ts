import { AutomationModule } from '@modules/automation/index.js';
import { YoutubeModule } from '@modules/integrations/youtube/index.js';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from '@packages/config';
import { configuration } from '@src/core/config/index.js';
import { CoreModule } from '@src/core/core.module.js';
import { TrpcRouter } from '@src/trpc/trpc.router.js';
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
    AutomationModule,
    YoutubeModule,
  ],
  providers: [
    TrpcRouter, // TrpcRouter will now create and manage the appRouter
  ],
})
export class AppModule {}
