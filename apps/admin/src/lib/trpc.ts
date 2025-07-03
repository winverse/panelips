import type { AppRouter } from '@apps/server/router';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
