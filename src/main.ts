import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kiểm soát dữ liệu đầu vào toàn cục (SRS 4.2, 2.2):
  // - whitelist: loại bỏ field không khai báo trong DTO
  // - forbidNonWhitelisted: có field lạ -> báo lỗi 400 (chống Mass Assignment)
  // - transform: tự chuyển kiểu theo DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
