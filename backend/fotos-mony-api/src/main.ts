import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // habilitar CORS para el frontend local
  app.enableCors({
    origin: ['http://localhost:5173'], // puerto de Vite
    credentials: true,
  });

  // prefijo común para tus rutas
  app.setGlobalPrefix('api');

  await app.listen(3000);
  console.log(`API corriendo en http://localhost:3000/api`);
}
bootstrap();

