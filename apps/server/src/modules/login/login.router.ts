import { INestApplication } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service.js';
import { LoginService } from './login.service.js';

export function createLoginRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const loginService = app.get(LoginService);

  return trpcService.router({
    googleLogin: trpcService.procedure
      .meta({ description: '구글 로그인' })
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const { email, password } = input;
        const success = await loginService.googleLogin(email, password);
        return { success };
      }),
  });
}

export type LoginRouter = ReturnType<typeof createLoginRouter>;
