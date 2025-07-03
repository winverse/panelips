import * as process from 'node:process';
import { AppRouter } from '@apps/server/router';
import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client';

if (!process.env.NEXT_PUBLIC_API_HOST) {
  throw new Error('NEXT_PUBLIC_API_HOST is not defined');
}

export const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:8080',
    }),
  ],
}) as ReturnType<typeof createTRPCClient<AppRouter>>;
