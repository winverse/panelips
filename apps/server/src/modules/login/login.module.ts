import { Module } from '@nestjs/common';
import { LoginService } from './login.service.js';

@Module({
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
