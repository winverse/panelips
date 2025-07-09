import { ScrapService } from '@modules/scrap/scrap.service.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@packages/config';
import { TrpcModule } from '@src/trpc/trpc.module.js';
// import { ScrapRouter } from './scrap.router.js'; // No longer needed here

@Module({
  imports: [TrpcModule, ConfigModule],
  providers: [ScrapService],
  exports: [ScrapService],
})
export class ScrapModule {}