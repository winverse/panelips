import { ScrapService } from '@modules/scrap/scrap.service.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@packages/config';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { ScrapRouter } from './scrap.router.js';

@Module({
  imports: [TrpcModule, ConfigModule],
  providers: [ScrapRouter, ScrapService],
  exports: [ScrapRouter],
})
export class ScrapModule {}
