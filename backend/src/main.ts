import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';
import { readConfig } from './config';

export async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '32kb' }));
  app.enableCors({ origin: config.FRONTEND_ORIGIN, methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] });
  app.enableShutdownHooks();
  await app.listen(config.PORT, config.HOST);
  return app;
}
if (require.main === module) void bootstrap().catch(() => {
  console.error('Backend startup failed. Check configuration and PostgreSQL.');
  process.exitCode = 1;
});
