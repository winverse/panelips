import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const server = await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  return { address: server.address() };
}

bootstrap()
  .then((address) => {
    console.log(`Application started successfully. Address ${address}`);
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
