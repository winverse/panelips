import { MongoService } from '@core/database/mongo/index.js';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [MongoService],
  exports: [MongoService],
})
export class CoreModule {}
