import type { TRPCDefaultErrorShape, TRPCErrorFormatter, TRPCRootObject } from '@trpc/server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type superjson from 'superjson';

export type TrpcContext = {
  req: FastifyRequest;
  reply: FastifyReply;
};

export type TrpcMeta = Record<string, unknown>; // Changed from {}

export type TrpcInstance = TRPCRootObject<
  TrpcContext,
  TrpcMeta,
  {
    transformer: typeof superjson;
    errorFormatter: TRPCErrorFormatter<TrpcContext, TRPCDefaultErrorShape>;
  },
  {
    ctx: TrpcContext;
    meta: TrpcMeta;
    errorShape: TRPCDefaultErrorShape;
    transformer: true;
  }
>;
