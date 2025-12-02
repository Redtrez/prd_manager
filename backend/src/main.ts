import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const nodeCrypto = require('crypto');
  (globalThis as any).crypto = nodeCrypto as any;
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);
  const protoDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data/prototypes');
  app.use('/prototypes', express.static(protoDir));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
