import type {
  TRPCDefaultErrorShape,
  TRPCErrorFormatter,
  TRPCRootObject,
} from '@trpc/server';
import type superjson from 'superjson';

export type TrpcContext = {};

export type TrpcMeta = {};

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
