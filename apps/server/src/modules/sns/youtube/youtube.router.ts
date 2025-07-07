import { Injectable } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Injectable()
export class YoutubeRouter {
  constructor(private readonly trpcService: TrpcService) {}
  get router() {
    return this.trpcService.router({
      getNewVideo: this.trpcService.procedure
        .input(
          z.object({
            channel: z.string().min(1).max(100).url(),
          }),
        )
        .output(z.record(z.string(), z.array(z.string())))
        .mutation(({ input }) => {
          console.log(input);
          return { channel: ['hello'] };
        }),
    });
  }
}
