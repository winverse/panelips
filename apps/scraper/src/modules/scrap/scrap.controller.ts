import { Controller } from '@nestjs/common';
import type { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Controller({
  path: '/scrap',
})
export class ScrapController {
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
