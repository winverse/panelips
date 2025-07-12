import { Module } from '@nestjs/common';
import { GoogleService } from './google.service.js';

@Module({
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
