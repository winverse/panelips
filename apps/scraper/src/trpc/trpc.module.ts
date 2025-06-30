import { Module } from '@nestjs/common';
import { TrpcRouter } from './trpc.router.js';
import { TrpcService } from './trpc.service.js';

@Module({
  imports: [],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {}
