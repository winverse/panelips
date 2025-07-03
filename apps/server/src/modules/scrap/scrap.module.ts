import { ScrapService } from '@modules/scrap/scrap.service.js';
import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { ScrapRouter } from './scrap.router.js';

@Module({
  imports: [TrpcModule],
  providers: [ScrapRouter, ScrapService],
  exports: [ScrapRouter],
})
export class ScrapModule {}
