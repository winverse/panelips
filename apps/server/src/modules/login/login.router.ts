import { INestApplication } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';
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
      .output(
        z.object({
          success: z.boolean(),
          error: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { email, password } = input;
        try {
          await loginService.googleLogin(email, password);
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An unknown error occurred';
          return { success: false, error: message };
        }
      }),
  });
}

export type LoginRouter = ReturnType<typeof createLoginRouter>;
