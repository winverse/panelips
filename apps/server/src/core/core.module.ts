import { Global, Module } from '@nestjs/common';
import { MongoService } from './database/mongo/mongo.service.js';

@Global()
@Module({
  providers: [MongoService],
  exports: [MongoService],
})
export class CoreModule {}
