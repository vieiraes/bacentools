import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir acesso à API
  app.enableCors();
  
  // Prefixar todas as rotas com /api
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3344;
  await app.listen(port, '0.0.0.0');
  logger.log(`API rodando na porta ${port}`);
}
bootstrap();