import { LoginService } from '@modules/login/login.service.js';
import { Injectable } from '@nestjs/common';
import { TrpcService } from '@src/trpc/trpc.service.js';
import { z } from 'zod';

@Injectable()
export class LoginRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly loginService: LoginService,
  ) {}
  get router() {
    return this.trpcService.router({
      googleLogin: this.trpcService.procedure
        .meta({
          description: 'google login',
        })
        .input(
          z.object({
            googleEmail: z.string().min(5).max(100).email(),
            googlePassword: z.string().min(5).max(100),
          }),
        )
        .mutation(({ input }) => {
          const { googleEmail, googlePassword } = input;
          return this.loginService.googleLogin(googleEmail, googlePassword);
        }),
    });
  }
}
