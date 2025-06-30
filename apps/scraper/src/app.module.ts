import { Module } from '@nestjs/common';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [TrpcModule],
  providers: [],
})
export class AppModule {}
