import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service.js';

@Module({
  imports: [],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
