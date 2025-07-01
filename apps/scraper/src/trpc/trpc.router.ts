import { APP_ROUTER } from '@constants/token.js';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import type { FastifyInstance } from 'fastify';
import { TrpcService } from './trpc.service.js';

type AppRouter = ReturnType<TrpcService['router']>;

@Injectable()
export class TrpcRouter implements OnApplicationBootstrap {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly trpcService: TrpcService,
    @Inject(APP_ROUTER) private readonly appRouter: AppRouter,
  ) {}

  onApplicationBootstrap() {
    const fastifyInstance =
      this.adapterHost.httpAdapter.getInstance<FastifyInstance>();
    this.register(fastifyInstance);
  }

  private async register(app: FastifyInstance) {
    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: this.appRouter,
        createContext: (opts) => this.trpcService.createContext(opts),
        onError({ path, error }) {
          console.error(
            `Error in tRPC handler on path '${path}': ${error.code} ${error.cause}`,
          );
        },
      } satisfies FastifyTRPCPluginOptions<
        typeof this.appRouter
      >['trpcOptions'],
    });
    console.log('✅ tRPC router registered successfully on /trpc');
  }
}
