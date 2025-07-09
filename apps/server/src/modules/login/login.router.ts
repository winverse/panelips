import { INestApplication } from '@nestjs/common'; // Import INestApplication
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service.js'; // Relative import
import { LoginService } from './login.service.js'; // Relative import

// Export a function that creates the router
export function createLoginRouter(app: INestApplication) {
  const trpcService = app.get(TrpcService);
  const loginService = app.get(LoginService);

  return trpcService.router({
    googleLogin: trpcService.procedure
      .meta({ description: '구글 로그인' }) // Korean description
      .input(
        z.object({
          email: z.string().email(), // Changed from googleEmail
          password: z.string(), // Changed from googlePassword
        }),
      )
      .mutation(async ({ input }) => {
        const { email, password } = input; // Changed from googleEmail, googlePassword
        const success = await loginService.googleLogin(email, password);
        return { success };
      }),
  });
}

export type LoginRouter = ReturnType<typeof createLoginRouter>; // Export type for consistency
