import { Injectable } from '@nestjs/common';
import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import type { FastifyInstance } from 'fastify';
// biome-ignore lint/style/useImportType: <explanation>
import { TrpcService } from './trpc.service.js';

@Injectable()
export class TrpcRouter {
  constructor(private readonly trpcService: TrpcService) {}

  async register(app: FastifyInstance) {
    const appRouter = this.createAppRouter();

    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext: async (opts) =>
          await this.trpcService.createContext(opts),
        onError({ path, error }) {
          // report to error monitoring
          console.error(`Error in tRPC handler on path '${path}':`, error);
        },
      } satisfies FastifyTRPCPluginOptions<typeof appRouter>['trpcOptions'],
    });
  }

  private createAppRouter() {
    return this.trpcService.router({});
  }
}
