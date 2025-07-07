import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      maxParamLength: 5000,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? '8080';
  const server = await app.listen(port);

  console.log(`Listening on port ${port}`);
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
