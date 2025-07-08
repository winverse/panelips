import { ScrapService } from '@modules/scrap/scrap.service.js';
import { Injectable } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Injectable()
export class ScrapRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly scrapService: ScrapService,
  ) {}
  get router() {
    return this.trpcService.router({
      youtubeChannel: this.trpcService.procedure
        .meta({ description: 'hello' })
        .input(
          z.object({
            googleEmail: z.string().min(5).max(100).email(),
            googlePassword: z.string().min(5).max(100),
          }),
        )
        .mutation(({ input }) => {
          const { googleEmail, googlePassword } = input;
          return this.scrapService.youtubeChannelScrap(googleEmail, googlePassword);
        }),
    });
  }
}
