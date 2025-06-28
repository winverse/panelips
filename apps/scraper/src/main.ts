import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const port = process.env.PORT ?? '8080';
  const server = await app.listen(port);
  return {
    address: server.address(),
    port,
  };
}

bootstrap()
  .then(({ port }) => {
    console.log(
      `Application started successfully. Address: http://localhost:${port}`,
    );
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
