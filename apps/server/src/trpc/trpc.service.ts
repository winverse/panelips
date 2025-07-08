import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';
import { TRPCPanelMeta } from 'trpc-ui';
import type { TrpcContext } from './trpc.interface.js';

@Injectable()
export class TrpcService {
  private readonly trpc = initTRPC.meta<TRPCPanelMeta>().context<TrpcContext>().create({
    transformer: superjson,
  });

  get router() {
    return this.trpc.router;
  }

  get procedure() {
    return this.trpc.procedure;
  }

  public async createContext({ req, res }: CreateFastifyContextOptions): Promise<TrpcContext> {
    return {
      req,
      reply: res,
    };
  }
}
