import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '../../../server/dist/app.router';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
