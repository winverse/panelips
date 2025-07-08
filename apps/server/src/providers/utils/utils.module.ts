import { Module } from '@nestjs/common';
import { UtilsService } from '@providers/utils/utils.service.js';

@Module({
  exports: [UtilsService],
  providers: [UtilsService],
})
export class UtilsModule {}
