import { initTracing } from './tracing';
initTracing();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { register } from './metrics';
import { logger } from './logger';
import pinoHttp from 'pino-http';
import { getPinoHttpOptions } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  app.use(pinoHttp(getPinoHttpOptions()));

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.info({ port }, 'NestJS observe example started');
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start application');
  process.exit(1);
});
