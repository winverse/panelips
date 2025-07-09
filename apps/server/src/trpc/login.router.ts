import { LoginService } from '@modules/login/index.js';
import { INestApplication } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from './trpc.service.js';

export function createLoginRouter(app: INestApplication) {
  const trpc = app.get(TrpcService);
  const loginService = app.get(LoginService);

  return trpc.router({
    googleLogin: trpc.procedure
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
