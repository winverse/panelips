import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { TrpcContext } from './trpc.interface.js';

@Injectable()
export class TrpcService {
  private readonly trpc = initTRPC.context<TrpcContext>().create({
    transformer: superjson,
    errorFormatter(opts) {
      const { shape, error, ctx, path, input } = opts;
      return {
        ...shape,
        data: {
          ctx,
          ...shape.data,
          path,
          input,
          zodError:
            error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      };
    },
  });

  get router() {
    return this.trpc.router;
  }

  get procedure() {
    return this.trpc.procedure;
  }

  public async createContext({
    req,
    res,
  }: CreateFastifyContextOptions): Promise<TrpcContext> {
    console.log('createContext', req, res);
    return {};
  }
}
