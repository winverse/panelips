import { LoginRouter } from '@modules/login/login.router.js';
import { LoginService } from '@modules/login/login.service.js';
import { Module } from '@nestjs/common';
import { TrpcModule } from '@src/trpc/trpc.module.js';

@Module({
  imports: [TrpcModule],
  providers: [LoginRouter, LoginService],
  exports: [LoginRouter, LoginService],
})
export class LoginModule {}
