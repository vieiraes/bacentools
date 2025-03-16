import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para Firebase Hosting
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3344',
      'https://bacentools.web.app',
      'https://bacentools.firebaseapp.com',
      'https://bacentools.fly.dev'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`Aplicação rodando na porta ${port}`);
}
bootstrap();