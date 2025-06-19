import { ScrapService } from '@modules/scrap/scrap.service.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [],
  exports: [ScrapService],
})
export class ScrapModule {}
