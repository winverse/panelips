import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';
import { ScrapRouter } from './scrap.router.js';

@Module({
  imports: [TrpcModule],
  providers: [ScrapRouter],
  exports: [ScrapRouter],
})
export class ScrapModule {}
