import { Injectable } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Injectable()
export class ScrapRouter {
  constructor(private readonly trpcService: TrpcService) {}
  get router() {
    return this.trpcService.router({
      youtubeChannel: this.trpcService.procedure
        .input(
          z.object({
            hello: z.string(),
          }),
        )
        .query(({ input }) => {
          console.log('input hello', input.hello);
          return 'hello';
        }),
    });
  }
}
