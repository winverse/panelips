import { INestApplication, Injectable } from '@nestjs/common'; // Keep INestApplication import
import { HttpAdapterHost } from '@nestjs/core';
import type { AnyRouter } from '@trpc/server';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { FastifyInstance } from 'fastify';
import { createAppRouter } from '../app.router.js';
import { TrpcService } from './trpc.service.js';

@Injectable()
export class TrpcRouter {
  private appRouter: AnyRouter;

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly trpcService: TrpcService,
  ) {}

  async applyMiddleware(app: INestApplication) {
    this.appRouter = createAppRouter(app, this.trpcService);

    const fastifyInstance = this.adapterHost.httpAdapter.getInstance<FastifyInstance>();
    await this.register(fastifyInstance);
    await this.registerUI(fastifyInstance);
  }

  private async register(app: FastifyInstance) {
    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: this.appRouter,
        createContext: (opts) => this.trpcService.createContext(opts),
        onError({ path, error }) {
          console.error(`Error in tRPC handler on path '${path}': ${error.code} ${error.cause}`);
        },
      } satisfies FastifyTRPCPluginOptions<typeof this.appRouter>['trpcOptions'],
    });
    console.log('✅ tRPC router registered successfully on /trpc');
  }

  private async registerUI(app: FastifyInstance) {
    if (process.env.NODE_ENV === 'production') return;

    const PORT = process.env.PORT ?? '8080';
    const { renderTrpcPanel } = await import('trpc-ui');
    app.get('/panel', (_req, res) => {
      return res.send(
        renderTrpcPanel(this.appRouter as any, {
          url: `http://localhost:${PORT}/trpc`,
          transformer: 'superjson',
        }),
      );
    });
  }
}
